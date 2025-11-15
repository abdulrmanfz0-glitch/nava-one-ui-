"""
Hooks System Module

Event-driven hooks system for pre/post operation events.

Features:
- Pre-operation hooks
- Post-operation hooks
- Async hook execution
- Hook chaining
- Error handling in hooks
"""

import logging
from typing import Callable, List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime
from enum import Enum


logger = logging.getLogger(__name__)


class HookEvent(Enum):
    """Hook event types"""
    PRE_FETCH = "pre_fetch"
    POST_FETCH = "post_fetch"
    PRE_PULL = "pre_pull"
    POST_PULL = "post_pull"
    PRE_PUSH = "pre_push"
    POST_PUSH = "post_push"
    PRE_MERGE = "pre_merge"
    POST_MERGE = "post_merge"
    PRE_WORKFLOW = "pre_workflow"
    POST_WORKFLOW = "post_workflow"
    ON_ERROR = "on_error"
    ON_SUCCESS = "on_success"


@dataclass
class HookContext:
    """Context passed to hook functions"""
    event: HookEvent
    repository: str
    branch: str
    operation: str
    timestamp: datetime
    metadata: Dict[str, Any]


HookFunction = Callable[[HookContext], Optional[bool]]


class HookManager:
    """
    Manages operation hooks
    """

    def __init__(self):
        """Initialize hook manager"""
        self.hooks: Dict[HookEvent, List[HookFunction]] = {
            event: [] for event in HookEvent
        }

    def register(self, event: HookEvent, hook_func: HookFunction):
        """
        Register a hook for an event

        Args:
            event: Hook event type
            hook_func: Function to call (should return True to continue, False to abort)
        """
        self.hooks[event].append(hook_func)
        logger.info(f"Registered hook for event: {event.value}")

    def unregister(self, event: HookEvent, hook_func: HookFunction):
        """
        Unregister a hook

        Args:
            event: Hook event type
            hook_func: Hook function to remove
        """
        if hook_func in self.hooks[event]:
            self.hooks[event].remove(hook_func)
            logger.info(f"Unregistered hook for event: {event.value}")

    def trigger(
        self,
        event: HookEvent,
        repository: str,
        branch: str,
        operation: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Trigger hooks for an event

        Args:
            event: Hook event to trigger
            repository: Repository name
            branch: Branch name
            operation: Operation name
            metadata: Optional metadata dict

        Returns:
            True if all hooks passed, False if any hook aborted
        """
        if not self.hooks[event]:
            return True

        context = HookContext(
            event=event,
            repository=repository,
            branch=branch,
            operation=operation,
            timestamp=datetime.now(),
            metadata=metadata or {}
        )

        logger.info(f"Triggering {len(self.hooks[event])} hook(s) for event: {event.value}")

        for hook_func in self.hooks[event]:
            try:
                result = hook_func(context)

                # If hook returns False, abort operation
                if result is False:
                    logger.warning(
                        f"Hook {hook_func.__name__} aborted operation for event: {event.value}"
                    )
                    return False

            except Exception as e:
                logger.error(f"Error in hook {hook_func.__name__}: {e}")
                # Continue with other hooks even if one fails
                continue

        return True

    def clear(self, event: Optional[HookEvent] = None):
        """
        Clear hooks

        Args:
            event: Specific event to clear (None = clear all)
        """
        if event:
            self.hooks[event] = []
            logger.info(f"Cleared hooks for event: {event.value}")
        else:
            for event_type in HookEvent:
                self.hooks[event_type] = []
            logger.info("Cleared all hooks")


# Global hook manager instance
_global_hook_manager = HookManager()


def register_hook(event: HookEvent, hook_func: HookFunction):
    """Register a global hook"""
    _global_hook_manager.register(event, hook_func)


def unregister_hook(event: HookEvent, hook_func: HookFunction):
    """Unregister a global hook"""
    _global_hook_manager.unregister(event, hook_func)


def trigger_hook(
    event: HookEvent,
    repository: str,
    branch: str,
    operation: str,
    metadata: Optional[Dict[str, Any]] = None
) -> bool:
    """Trigger a global hook"""
    return _global_hook_manager.trigger(event, repository, branch, operation, metadata)


def get_hook_manager() -> HookManager:
    """Get the global hook manager"""
    return _global_hook_manager


# Common hook examples

def logging_hook(context: HookContext) -> bool:
    """Example hook: Log all operations"""
    logger.info(
        f"[HOOK] {context.event.value}: "
        f"{context.operation} on {context.repository}/{context.branch}"
    )
    return True


def validation_hook(context: HookContext) -> bool:
    """Example hook: Validate operations before execution"""
    # Example: Prevent direct pushes to main
    if context.event == HookEvent.PRE_PUSH and context.branch == "main":
        logger.warning("Direct push to main branch blocked by hook")
        return False
    return True


def notification_hook(context: HookContext) -> bool:
    """Example hook: Send notifications on operations"""
    if context.event in [HookEvent.ON_SUCCESS, HookEvent.ON_ERROR]:
        # Would send notification here
        logger.info(f"Notification sent for {context.event.value}")
    return True
