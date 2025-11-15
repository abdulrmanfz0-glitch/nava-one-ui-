# Nava Ops - Architecture Documentation

## Overview

Nava Ops is designed with a modular architecture that separates concerns and enables efficient multi-branch Git operations. This document provides a detailed explanation of each module and the optimization strategies employed.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Application                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  MultibranchOrchestrator                     │
│  - Coordinates multi-branch workflows                        │
│  - Manages parallel execution                                │
│  - Generates reports                                         │
└───┬─────────────────┬─────────────────┬─────────────────────┘
    │                 │                 │
    │                 │                 │
    ▼                 ▼                 ▼
┌─────────┐    ┌──────────────┐  ┌────────────┐
│ Config  │    │ BranchOps    │  │ Reporting  │
│ Module  │    │ Module       │  │ Module     │
└─────────┘    └───────┬──────┘  └────────────┘
                       │
                       ▼
              ┌────────────────┐
              │ Utils Module   │
              └────────────────┘
```

## Module Breakdown

### 1. Configuration Module (`config.py`)

**Purpose**: Centralized configuration management with validation

**Design Patterns**:
- **Builder Pattern**: `from_file()` and `from_dict()` factory methods
- **Data Classes**: Immutable configuration objects
- **Validation**: Built-in validation with error reporting

**Key Components**:

#### BranchConfig
```python
@dataclass
class BranchConfig:
    name: str                    # Branch identifier
    remote: str                  # Remote name (default: "origin")
    auto_fetch: bool            # Auto-fetch on operations
    merge_strategy: str         # "merge", "rebase", or "squash"
```

**Why this design?**
- Encapsulates all branch-level settings
- Type-safe with dataclasses
- Easy to serialize/deserialize

#### RepositoryConfig
```python
@dataclass
class RepositoryConfig:
    path: str                        # Repository path
    name: str                        # Human-readable name
    branches: List[BranchConfig]    # Configured branches
    default_remote: str             # Default remote
```

**Why this design?**
- Groups all repository settings
- Supports multiple repositories
- Hierarchical configuration

#### Config (Main)
```python
@dataclass
class Config:
    repositories: List[RepositoryConfig]
    reporting: ReportingConfig
    parallel_operations: bool
    max_workers: int
    retry_attempts: int
    retry_delay: float
```

**Optimization Features**:
- `parallel_operations`: Enable/disable concurrency
- `max_workers`: Control thread pool size
- `retry_attempts` & `retry_delay`: Network resilience

### 2. Utilities Module (`utils.py`)

**Purpose**: Shared utilities for command execution and helpers

**Design Patterns**:
- **Command Pattern**: `CommandResult` encapsulates execution results
- **Retry Pattern**: Exponential backoff implementation
- **Strategy Pattern**: Different execution strategies

**Key Components**:

#### CommandResult
```python
@dataclass
class CommandResult:
    success: bool        # Operation success flag
    stdout: str          # Standard output
    stderr: str          # Standard error
    returncode: int      # Process return code
```

**Why this design?**
- Consistent return type across operations
- Includes all relevant execution details
- Easy to check success/failure

#### execute_command()
```python
def execute_command(
    command: List[str],
    cwd: Optional[str] = None,
    timeout: int = 30
) -> CommandResult
```

**Features**:
- **Timeout Protection**: Prevents hanging
- **Capture Output**: Both stdout and stderr
- **Error Handling**: Never crashes, returns result

**Why this design?**
- Safe subprocess execution
- Predictable behavior
- Easy to test and mock

#### retry_with_backoff()
```python
def retry_with_backoff(
    func,
    max_attempts: int = 3,
    initial_delay: float = 2.0,
    exponential_base: float = 2.0,
    *args, **kwargs
) -> CommandResult
```

**Optimization Strategy**:
- **Exponential Backoff**: 2s, 4s, 8s, 16s delays
- **Configurable**: Adjust attempts and delays
- **Generic**: Works with any function

**Why exponential backoff?**
- Network issues often temporary
- Prevents overwhelming servers
- Industry best practice

### 3. Branch Operations Module (`branch_ops.py`)

**Purpose**: Core Git branch operations with optimization

**Design Patterns**:
- **Facade Pattern**: Simplified Git command interface
- **Factory Pattern**: Creating operation results
- **Strategy Pattern**: Different merge strategies

**Key Components**:

#### BranchOperations

Single-repository branch operations.

**Key Methods**:

```python
def fetch_branch(branch_name, remote) -> OperationResult
```
- Uses retry logic
- 60-second timeout
- Returns structured result

```python
def pull_branch(branch_name, remote) -> OperationResult
```
- Retry with backoff
- 120-second timeout
- Updates current branch

```python
def merge_branch(source, target, strategy) -> OperationResult
```
- Supports: merge, rebase, squash
- Automatic branch switching
- Rollback on failure

**Optimization Features**:
1. **Retry Logic**: All network operations retry automatically
2. **Timeout Management**: Different timeouts for different operations
3. **Error Recovery**: Graceful handling of failures

#### MultiBranchOperations

Optimized operations across multiple branches.

**Key Method**:
```python
def fetch_all_branches(
    branch_names: List[str],
    remote: str = "origin"
) -> List[OperationResult]
```

**Optimization Strategy**:
```python
with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
    futures = {
        executor.submit(fetch_branch, branch, remote): branch
        for branch in branch_names
    }
    # Collect results as they complete
```

**Why this approach?**
- **Concurrent Execution**: Multiple fetches in parallel
- **Resource Control**: Limited by max_workers
- **Non-blocking**: Uses futures for async collection
- **4x Faster**: Typical speedup with 4 workers

**Performance Comparison**:
```
Sequential:  Branch1 (3s) → Branch2 (3s) → Branch3 (3s) = 9s
Parallel:    Branch1, Branch2, Branch3 (concurrent) = 3s
```

### 4. Reporting Module (`reporting.py`)

**Purpose**: Generate comprehensive reports in multiple formats

**Design Patterns**:
- **Builder Pattern**: Build complex reports incrementally
- **Strategy Pattern**: Different export formats
- **Template Pattern**: Format-specific rendering

**Key Components**:

#### Report Structure

```python
@dataclass
class ReportSummary:
    total_operations: int
    successful_operations: int
    failed_operations: int
    total_branches: int
    total_repositories: int
    start_time: datetime
    end_time: datetime
    duration_seconds: float

    @property
    def success_rate(self) -> float:
        return (successful / total) * 100
```

**Why this structure?**
- Clear metrics at a glance
- Calculated properties
- Time tracking for performance

#### ReportGenerator

**Export Formats**:

1. **JSON** (`export_json()`)
   - Machine-readable
   - Easy to parse
   - API-friendly

2. **Markdown** (`export_markdown()`)
   - Human-readable
   - Git-friendly
   - Documentation-ready

3. **HTML** (`export_html()`)
   - Interactive
   - Styled output
   - Dashboard-ready

**Optimization Features**:
- **Lazy Loading**: Generate only requested format
- **Streaming**: Handle large reports efficiently
- **Caching**: Reuse report data

### 5. Orchestrator Module (`orchestrator.py`)

**Purpose**: High-level coordination of multi-branch workflows

**Design Patterns**:
- **Facade Pattern**: Simple interface to complex operations
- **Orchestration Pattern**: Coordinate multiple components
- **Observer Pattern**: Report generation

**Key Components**:

#### MultibranchOrchestrator

**Architecture**:
```python
class MultibranchOrchestrator:
    def __init__(self, config: Config):
        self.config = config
        self.report_generator = ReportGenerator(config.reporting)
        self.errors = []
```

**Key Method**: `execute_workflow()`

```python
def execute_workflow(
    operations: List[str],
    repositories: Optional[List[str]] = None,
    branches: Optional[List[str]] = None
) -> Report
```

**Execution Flow**:
```
1. Validate inputs
2. Determine target repositories
3. For each repository:
   a. Determine target branches
   b. Execute operations sequentially per branch
4. Parallel execution across repositories (if enabled)
5. Collect results
6. Generate report
7. Return comprehensive report
```

**Optimization Strategies**:

1. **Parallel Repository Processing**:
```python
if self.config.parallel_operations and len(repos) > 1:
    with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
        # Process repositories in parallel
```

**Why parallel at repository level?**
- Repositories are independent
- No merge conflicts
- Maximum parallelization
- Resource efficient

2. **Sequential Branch Operations**:
```python
for operation in operations:
    result = execute_operation_on_branch(...)
    results.append(result)
```

**Why sequential per branch?**
- Operations often depend on previous ones
- Ensures correct order (fetch before pull)
- Prevents race conditions

3. **Error Handling**:
```python
try:
    result = operation()
except Exception as e:
    # Log error, continue processing
    errors.append(error_info)
```

**Why continue on error?**
- One failure shouldn't stop everything
- Collect all results for complete report
- User can see all issues at once

## Optimization Summary

### 1. Concurrency Model

**Two-Level Parallelization**:

```
Level 1: Repositories (Parallel)
└─ Repo1: ThreadPool
└─ Repo2: ThreadPool
└─ Repo3: ThreadPool

Level 2: Branches within Repo (Parallel for read-only ops)
   └─ Branch1: fetch
   └─ Branch2: fetch
   └─ Branch3: fetch
```

### 2. Retry Strategy

**Exponential Backoff**:
- Attempt 1: Immediate
- Attempt 2: 2s delay
- Attempt 3: 4s delay
- Attempt 4: 8s delay

**Why this works**:
- Temporary network issues resolve quickly
- Reduces server load
- Standard practice for network operations

### 3. Resource Management

**Thread Pool Configuration**:
```python
max_workers = 4  # Default
```

**Considerations**:
- Too few: Underutilized
- Too many: Context switching overhead
- 4 is optimal for most scenarios

### 4. Error Handling Strategy

**Graceful Degradation**:
1. Try operation
2. On failure, log error
3. Continue with remaining operations
4. Include all errors in report

**Benefits**:
- Complete visibility
- No silent failures
- User can prioritize fixes

## Performance Characteristics

### Time Complexity

- **Single Branch Operation**: O(1) - constant time
- **N Branches Sequential**: O(N) - linear time
- **N Branches Parallel**: O(N/W) - where W is workers
- **Report Generation**: O(N + M) - N operations + M branches

### Space Complexity

- **Configuration**: O(R × B) - R repos × B branches
- **Results**: O(O) - O operations
- **Reports**: O(O + B) - operations + branches

### Scalability

**Horizontal Scaling**:
- More workers = faster execution
- Limited by available cores
- Network bandwidth considerations

**Vertical Scaling**:
- More repositories supported
- Memory grows linearly
- Report generation remains efficient

## Design Decisions

### 1. Why Python Standard Library Only?

**Benefits**:
- No dependency management
- Easier deployment
- Reduced security surface
- Better compatibility

**Trade-offs**:
- Manual subprocess handling
- Custom retry logic
- No advanced features (async/await)

### 2. Why Dataclasses?

**Benefits**:
- Type safety
- Automatic __init__, __repr__
- Immutability support
- JSON serialization

### 3. Why Thread Pools vs Async?

**Thread Pools**:
- Simpler code
- Good for I/O bound (Git operations)
- Standard library support
- Easy to reason about

**Async Would Require**:
- External dependencies (aiofiles, etc.)
- More complex code
- Minimal benefit for subprocess calls

### 4. Why Separate Config Module?

**Benefits**:
- Single source of truth
- Easy to validate
- Can load from files
- Reusable configurations

## Extension Points

The architecture supports easy extension:

### 1. New Operations
```python
def new_operation(self, branch_name: str) -> OperationResult:
    # Implement new Git operation
    pass
```

### 2. New Report Formats
```python
def export_custom(self, report: Report) -> str:
    # Implement new format
    pass
```

### 3. Custom Workflows
```python
def custom_workflow(branch_ops, branch_config):
    # Define custom sequence
    pass
```

## Testing Strategy

Each module is independently testable:

1. **Config**: Test validation, loading, saving
2. **Utils**: Test command execution, retry logic
3. **BranchOps**: Test each Git operation
4. **Reporting**: Test each format export
5. **Orchestrator**: Test workflow coordination

## Conclusion

The Nava Ops architecture prioritizes:
- **Modularity**: Easy to understand and modify
- **Performance**: Optimized parallel execution
- **Reliability**: Retry logic and error handling
- **Maintainability**: Clear separation of concerns
- **Extensibility**: Easy to add new features

This design achieves efficient multi-branch operations while maintaining code quality and reliability.
