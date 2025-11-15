// src/components/analytics/PlatformAnalytics.jsx
import React, { useMemo, useState, useEffect } from "react";
import { supabase } from '@lib/supabase';
import { useAuth } from '@contexts/AuthContext';
import { useNotification } from '@contexts/NotificationContext';
import { exportUtils } from '@utils/exportUtils';
import { 
  TrendingUp, BarChart3, PieChart, Download, Search, Filter, Award, TrendingDown,
  DollarSign, ShoppingBag, Percent, Target, Calendar, RefreshCw, Eye, MoreVertical,
  ArrowUpRight, ArrowDownRight, Star, Crown, Zap, Activity
} from 'lucide-react';

/**
 * نظام تحليلات المنصات المتقدم مع رؤى تنبؤية ومقارنات متقدمة
 */
export default function PlatformAnalytics() {
  const { user, userProfile } = useAuth();
  const { addNotification } = useNotification();
  const [analyticsData, setAnalyticsData] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  
  const [filters, setFilters] = useState({
    search: "",
    minOrders: 0,
    minGMV: 0,
    performance: "all",
    sortBy: "gmv_desc"
  });

  // جلب البيانات من Supabase
  useEffect(() => {
    fetchAnalyticsData();
    fetchPlatforms();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // في الإنتاج الحقيقي، سنستخدم الاستعلامات الفعلية من Supabase
      // هنا نستخدم بيانات محسنة ومتنوعة للعرض
      const mockData = await generateEnhancedMockData();
      setAnalyticsData(mockData);
      
      addNotification({
        type: 'success',
        title: 'تم تحديث البيانات',
        message: 'تم تحميل أحدث بيانات التحليلات'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في تحميل البيانات',
        message: 'تعذر تحميل بيانات التحليلات'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPlatforms = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_accounts')
        .select(`
          id, 
          platform_name, 
          commission_rate, 
          color, 
          status,
          integration_type,
          created_at,
          last_sync
        `)
        .eq('status', 'active')
        .order('platform_name');

      if (error) throw error;
      setPlatforms(data || []);
    } catch (error) {
      // Error fetching platforms silently
    }
  };

  const generateEnhancedMockData = async () => {
    // بيانات محسنة ومتنوعة تشمل اتجاهات ونمو
    const platforms = ['طلب', 'هنقرستيشن', 'جاب', 'جاهز', 'طيب', 'تميم', 'سفرة'];
    const data = [];
    
    const getTrendMultiplier = (platform, weekIndex) => {
      const trends = {
        'طلب': 1.1 + (weekIndex * 0.05), // نمو إيجابي
        'هنقرستيشن': 0.95 + (weekIndex * 0.02), // نمو بطيء
        'جاب': 1.2 + (weekIndex * 0.08), // نمو قوي
        'جاهز': 0.9 - (weekIndex * 0.03), // انخفاض
        'طيب': 1.0 + (weekIndex * 0.01), // استقرار
        'تميم': 1.15 + (weekIndex * 0.06), // نمو جيد
        'سفرة': 0.85 - (weekIndex * 0.02) // انخفاض
      };
      return trends[platform] || 1.0;
    };

    platforms.forEach(platform => {
      let baseOrders = Math.floor(Math.random() * 300) + 100;
      let baseGMV = Math.floor(Math.random() * 15000) + 8000;
      
      for (let i = 0; i < 8; i++) { // 8 أسابيع للتحليل الزمني
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - ((7 - i) * 7));
        
        const trend = getTrendMultiplier(platform, i);
        const weekOrders = Math.floor(baseOrders * trend);
        const weekGMV = Math.floor(baseGMV * trend);
        const commissionRate = 15 + (Math.random() * 10); // بين 15% و 25%
        const commission = Math.floor(weekGMV * (commissionRate / 100));
        const vat = Math.floor(commission * 0.15);
        const netProfit = weekGMV - commission - vat;

        data.push({
          id: `${platform}-${i}`,
          platform: platform,
          week_start: weekStart.toISOString().split('T')[0],
          week_number: i + 1,
          orders: weekOrders,
          gmv: weekGMV,
          commission: commission,
          net_profit: netProfit,
          vat: vat,
          commission_rate: commissionRate,
          customer_rating: 4.0 + (Math.random() * 1.5), // بين 4.0 و 5.5
          delivery_time: 25 + (Math.random() * 20), // بين 25 و 45 دقيقة
          cancellation_rate: 1 + (Math.random() * 4) // بين 1% و 5%
        });
      }
    });
    
    return data;
  };

  // تحديث البيانات يدوياً
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
  };

  const fmtMoney = (n) =>
    new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 0,
    }).format(n || 0);

  const fmtNumber = (n) =>
    new Intl.NumberFormat("ar-SA").format(n || 0);

  const fmtPercent = (n) =>
    new Intl.NumberFormat("ar-SA", {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format((n || 0) / 100);

  // حساب الإحصائيات الأساسية مع اتجاهات النمو
  const baseStats = useMemo(() => {
    const platformMap = new Map();
    
    // تجميع البيانات حسب المنصة
    analyticsData.forEach(record => {
      const platformName = record.platform;
      if (!platformMap.has(platformName)) {
        platformMap.set(platformName, []);
      }
      platformMap.get(platformName).push(record);
    });

    const platformStats = platforms.map(platform => {
      const records = platformMap.get(platform.platform_name) || [];
      const sortedRecords = records.sort((a, b) => new Date(a.week_start) - new Date(b.week_start));
      
      // حساب الإجماليات
      const totals = sortedRecords.reduce((acc, record) => ({
        gmv: acc.gmv + (Number(record.gmv) || 0),
        commission: acc.commission + (Number(record.commission) || 0),
        netProfit: acc.netProfit + (Number(record.net_profit) || 0),
        orders: acc.orders + (Number(record.orders) || 0),
        vat: acc.vat + (Number(record.vat) || 0)
      }), { gmv: 0, commission: 0, netProfit: 0, orders: 0, vat: 0 });

      // حساب اتجاهات النمو (آخر 4 أسابيع vs أول 4 أسابيع)
      const recentWeeks = sortedRecords.slice(-4);
      const olderWeeks = sortedRecords.slice(0, 4);
      
      const recentGMV = recentWeeks.reduce((sum, r) => sum + (r.gmv || 0), 0);
      const olderGMV = olderWeeks.reduce((sum, r) => sum + (r.gmv || 0), 0);
      const gmvGrowth = olderGMV > 0 ? ((recentGMV - olderGMV) / olderGMV) * 100 : 0;

      const recentOrders = recentWeeks.reduce((sum, r) => sum + (r.orders || 0), 0);
      const olderOrders = olderWeeks.reduce((sum, r) => sum + (r.orders || 0), 0);
      const ordersGrowth = olderOrders > 0 ? ((recentOrders - olderOrders) / olderOrders) * 100 : 0;

      // إحصائيات متقدمة
      const profitMargin = totals.gmv > 0 ? (totals.netProfit / totals.gmv) * 100 : 0;
      const avgOrderValue = totals.orders > 0 ? totals.gmv / totals.orders : 0;
      const commissionRate = platform.commission_rate || (totals.gmv > 0 ? (totals.commission / totals.gmv) * 100 : 0);
      
      // متوسط التقييم ووقت التوصيل
      const avgRating = records.length > 0 ? 
        records.reduce((sum, r) => sum + (r.customer_rating || 0), 0) / records.length : 0;
      
      const avgDeliveryTime = records.length > 0 ? 
        records.reduce((sum, r) => sum + (r.delivery_time || 0), 0) / records.length : 0;

      const avgCancellationRate = records.length > 0 ? 
        records.reduce((sum, r) => sum + (r.cancellation_rate || 0), 0) / records.length : 0;

      // تحديد تصنيف الأداء المتقدم
      let performance;
      const performanceScore = (profitMargin * 0.4) + (gmvGrowth * 0.3) + (avgRating * 10) + ((100 - avgCancellationRate) * 0.2);
      
      if (performanceScore > 85) {
        performance = { 
          label: "ممتاز", 
          color: "text-green-600", 
          bgColor: "bg-green-100", 
          borderColor: "border-green-300",
          icon: Crown,
          level: 5
        };
      } else if (performanceScore > 70) {
        performance = { 
          label: "جيد جداً", 
          color: "text-blue-600", 
          bgColor: "bg-blue-100", 
          borderColor: "border-blue-300",
          icon: TrendingUp,
          level: 4
        };
      } else if (performanceScore > 55) {
        performance = { 
          label: "جيد", 
          color: "text-yellow-600", 
          bgColor: "bg-yellow-100", 
          borderColor: "border-yellow-300",
          icon: Activity,
          level: 3
        };
      } else if (performanceScore > 40) {
        performance = { 
          label: "مقبول", 
          color: "text-orange-600", 
          bgColor: "bg-orange-100", 
          borderColor: "border-orange-300",
          icon: Target,
          level: 2
        };
      } else {
        performance = { 
          label: "يحتاج تحسين", 
          color: "text-red-600", 
          bgColor: "bg-red-100", 
          borderColor: "border-red-300",
          icon: TrendingDown,
          level: 1
        };
      }

      return {
        id: platform.id,
        name: platform.platform_name,
        color: platform.color || getPlatformColor(platform.platform_name),
        commissionRate,
        ...totals,
        profitMargin,
        avgOrderValue,
        performance,
        recordsCount: records.length,
        // اتجاهات النمو
        gmvGrowth,
        ordersGrowth,
        // مؤشرات الجودة
        avgRating: Number(avgRating.toFixed(1)),
        avgDeliveryTime: Number(avgDeliveryTime.toFixed(0)),
        avgCancellationRate: Number(avgCancellationRate.toFixed(1)),
        // النقاط
        performanceScore: Number(performanceScore.toFixed(1)),
        // بيانات زمنية للرسوم البيانية
        weeklyData: sortedRecords
      };
    });

    return platformStats;
  }, [analyticsData, platforms]);

  // الحصول على لون افتراضي للمنصة
  const getPlatformColor = (platformName) => {
    const colors = {
      'طلب': '#FF6B35',
      'هنقرستيشن': '#00B4A8',
      'جاب': '#7856FF',
      'جاهز': '#FFAA00',
      'طيب': '#2E86AB',
      'تميم': '#9C27B0',
      'سفرة': '#4CAF50'
    };
    return colors[platformName] || '#6B7280';
  };

  // تطبيق الفلاتر والترتيب
  const filteredAndSorted = useMemo(() => {
    let data = [...baseStats];

    // البحث
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();
      data = data.filter(p => p.name.toLowerCase().includes(query));
    }

    // الحد الأدنى للطلبات
    if (filters.minOrders > 0) {
      data = data.filter(p => p.orders >= Number(filters.minOrders));
    }

    // الحد الأدنى للمبيعات
    if (filters.minGMV > 0) {
      data = data.filter(p => p.gmv >= Number(filters.minGMV));
    }

    // فلترة الأداء
    if (filters.performance !== "all") {
      data = data.filter(p => p.performance.level >= Number(filters.performance));
    }

    // الترتيب
    switch (filters.sortBy) {
      case "profit_desc":
        data.sort((a, b) => b.netProfit - a.netProfit);
        break;
      case "margin_desc":
        data.sort((a, b) => b.profitMargin - a.profitMargin);
        break;
      case "orders_desc":
        data.sort((a, b) => b.orders - a.orders);
        break;
      case "growth_desc":
        data.sort((a, b) => b.gmvGrowth - a.gmvGrowth);
        break;
      case "rating_desc":
        data.sort((a, b) => b.avgRating - a.avgRating);
        break;
      case "score_desc":
        data.sort((a, b) => b.performanceScore - a.performanceScore);
        break;
      case "gmv_desc":
      default:
        data.sort((a, b) => b.gmv - a.gmv);
        break;
    }

    return data;
  }, [baseStats, filters]);

  // أفضل منصة أداءً
  const topPerformer = useMemo(() => {
    if (filteredAndSorted.length === 0) return null;
    return filteredAndSorted.reduce((top, current) => 
      current.performanceScore > top.performanceScore ? current : top
    );
  }, [filteredAndSorted]);

  // أسوأ منصة أداءً
  const worstPerformer = useMemo(() => {
    if (filteredAndSorted.length === 0) return null;
    return filteredAndSorted.reduce((worst, current) => 
      current.performanceScore < worst.performanceScore ? current : worst
    );
  }, [filteredAndSorted]);

  // إجمالي الإحصائيات
  const totalStats = useMemo(() => {
    return filteredAndSorted.reduce((totals, platform) => ({
      gmv: totals.gmv + platform.gmv,
      commission: totals.commission + platform.commission,
      netProfit: totals.netProfit + platform.netProfit,
      orders: totals.orders + platform.orders,
      platforms: totals.platforms + 1
    }), { gmv: 0, commission: 0, netProfit: 0, orders: 0, platforms: 0 });
  }, [filteredAndSorted]);

  // متوسط النمو
  const averageGrowth = useMemo(() => {
    if (filteredAndSorted.length === 0) return 0;
    const totalGrowth = filteredAndSorted.reduce((sum, p) => sum + p.gmvGrowth, 0);
    return totalGrowth / filteredAndSorted.length;
  }, [filteredAndSorted]);

  // تصدير البيانات
  const handleExportCSV = () => {
    const rows = filteredAndSorted.map(p => ({
      'المنصة': p.name,
      'عدد الطلبات': p.orders,
      'إجمالي المبيعات': p.gmv,
      'العمولات': p.commission,
      'صافي الربح': p.netProfit,
      'هامش الربح': `${p.profitMargin.toFixed(2)}%`,
      'متوسط قيمة الطلب': fmtMoney(p.avgOrderValue),
      'معدل العمولة': `${p.commissionRate.toFixed(2)}%`,
      'نمو المبيعات': `${p.gmvGrowth.toFixed(1)}%`,
      'تقييم العملاء': p.avgRating,
      'متوسط وقت التوصيل': `${p.avgDeliveryTime} دقيقة`,
      'معدل الإلغاء': `${p.avgCancellationRate}%`,
      'تقييم الأداء': p.performance.label,
      'النقاط': p.performanceScore
    }));
    
    exportUtils.exportToCSV(rows, `تحليلات_المنصات_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPDF = () => {
    exportUtils.exportToPDF("#platform-analytics-root", `تقرير_المنصات_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPlatformDetails = (platform) => {
    const rows = platform.weeklyData.map(record => ({
      'الأسبوع': record.week_start,
      'المنصة': platform.name,
      'عدد الطلبات': record.orders,
      'إجمالي المبيعات': record.gmv,
      'العمولات': record.commission,
      'صافي الربح': record.net_profit,
      'معدل العمولة': `${record.commission_rate.toFixed(2)}%`,
      'تقييم العملاء': record.customer_rating,
      'وقت التوصيل': `${record.delivery_time} دقيقة`,
      'معدل الإلغاء': `${record.cancellation_rate}%`
    }));
    
    exportUtils.exportToCSV(rows, `تفاصيل_${platform.name}_${new Date().toISOString().split('T')[0]}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل بيانات التحليلات...</p>
          <p className="text-gray-500 text-sm mt-2">قد تستغرق العملية بضع ثوانٍ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" id="platform-analytics-root">
      {/* البطاقة الرئيسية */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-200">
        
        {/* الهيدر المحسن */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">التحليلات المتقدمة للمنصات</h1>
            <p className="text-gray-600 mt-1">مقارنات شاملة للأداء والربحية مع رؤى تنبؤية</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'جاري التحديث...' : 'تحديث البيانات'}
            </button>
            <button
              onClick={handleExportCSV}
              className="btn-success flex items-center gap-2"
            >
              <Download size={18} />
              تصدير CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="btn-primary flex items-center gap-2"
            >
              <BarChart3 size={18} />
              تصدير PDF
            </button>
          </div>
        </div>

        {/* الفلاتر والتحكم المتقدمة */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="ابحث باسم المنصة..."
              className="w-full pr-10 pl-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          
          <input
            type="number"
            min="0"
            placeholder="الحد الأدنى للطلبات"
            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filters.minOrders}
            onChange={(e) => setFilters({ ...filters, minOrders: e.target.value })}
          />

          <input
            type="number"
            min="0"
            placeholder="الحد الأدنى للمبيعات"
            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filters.minGMV}
            onChange={(e) => setFilters({ ...filters, minGMV: e.target.value })}
          />

          <select
            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filters.performance}
            onChange={(e) => setFilters({ ...filters, performance: e.target.value })}
          >
            <option value="all">جميع المستويات</option>
            <option value="5">ممتاز فقط</option>
            <option value="4">جيد جداً فما فوق</option>
            <option value="3">جيد فما فوق</option>
            <option value="2">مقبول فما فوق</option>
          </select>

          <select
            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
          >
            <option value="gmv_desc">الأعلى مبيعاً</option>
            <option value="profit_desc">الأعلى ربحاً</option>
            <option value="margin_desc">الأعلى هامشاً</option>
            <option value="orders_desc">الأكثر طلبات</option>
            <option value="growth_desc">الأعلى نمواً</option>
            <option value="rating_desc">الأعلى تقييماً</option>
            <option value="score_desc">الأعلى نقاطاً</option>
          </select>

          <select
            className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7d">آخر 7 أيام</option>
            <option value="30d">آخر 30 يوم</option>
            <option value="90d">آخر 90 يوم</option>
            <option value="1y">آخر سنة</option>
            <option value="all">كل الفترات</option>
          </select>
        </div>

        {/* الإحصائيات الإجمالية المحسنة */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <StatCard 
            title="إجمالي المبيعات" 
            value={fmtMoney(totalStats.gmv)} 
            icon={DollarSign}
            color="blue"
            change={averageGrowth}
            changeType="percent"
          />
          <StatCard 
            title="صافي الربح" 
            value={fmtMoney(totalStats.netProfit)} 
            icon={TrendingUp}
            color="green"
          />
          <StatCard 
            title="إجمالي الطلبات" 
            value={fmtNumber(totalStats.orders)} 
            icon={ShoppingBag}
            color="purple"
          />
          <StatCard 
            title="متوسط الهامش" 
            value={totalStats.gmv > 0 ? ((totalStats.netProfit / totalStats.gmv) * 100).toFixed(1) + '%' : '0%'} 
            icon={Percent}
            color="amber"
          />
          <StatCard 
            title="عدد المنصات" 
            value={fmtNumber(totalStats.platforms)} 
            icon={BarChart3}
            color="indigo"
          />
          <StatCard 
            title="متوسط النمو" 
            value={averageGrowth.toFixed(1) + '%'} 
            icon={Activity}
            color={averageGrowth >= 0 ? "green" : "red"}
          />
        </div>

        {/* أفضل وأسوأ أداء */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {topPerformer && (
            <TopPerformerCard 
              performer={topPerformer} 
              type="best" 
              fmtMoney={fmtMoney}
              onViewDetails={() => setSelectedPlatform(topPerformer)}
            />
          )}
          {worstPerformer && (
            <TopPerformerCard 
              performer={worstPerformer} 
              type="worst" 
              fmtMoney={fmtMoney}
              onViewDetails={() => setSelectedPlatform(worstPerformer)}
            />
          )}
        </div>

        {/* توزيع الأداء */}
        <PerformanceDistribution platforms={filteredAndSorted} />

        {/* شبكة بطاقات المنصات المحسنة */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSorted.map((platform) => (
            <EnhancedPlatformCard 
              key={platform.id} 
              platform={platform} 
              fmtMoney={fmtMoney}
              fmtPercent={fmtPercent}
              onViewDetails={() => setSelectedPlatform(platform)}
              onExportDetails={() => handleExportPlatformDetails(platform)}
            />
          ))}
          
          {filteredAndSorted.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg">لا توجد بيانات مطابقة للفلاتر الحالية</p>
              <p className="text-sm mt-2">جرب تعديل شروط البحث أو إعادة تعيين الفلاتر</p>
            </div>
          )}
        </div>
      </div>

      {/* نافذة تفاصيل المنصة */}
      <PlatformDetailsModal
        show={!!selectedPlatform}
        platform={selectedPlatform}
        onClose={() => setSelectedPlatform(null)}
        fmtMoney={fmtMoney}
        fmtPercent={fmtPercent}
        fmtNumber={fmtNumber}
      />
    </div>
  );
}

// مكون البطاقة الإحصائية المحسنة
function StatCard({ title, value, icon: Icon, color, change, changeType = "value" }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    red: 'bg-red-50 border-red-200 text-red-700'
  };

  const isPositive = change >= 0;

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">{title}</div>
        <Icon size={20} className="opacity-50" />
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      {change !== undefined && (
        <div className={`text-xs flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {changeType === 'percent' ? `${Math.abs(change).toFixed(1)}%` : fmtMoney(Math.abs(change))}
          <span className="text-gray-500 mr-1"> عن الشهر الماضي</span>
        </div>
      )}
    </div>
  );
}

// مكون أفضل/أسوأ أداء
function TopPerformerCard({ performer, type, fmtMoney, onViewDetails }) {
  const isBest = type === 'best';
  const PerformanceIcon = performer.performance.icon;

  return (
    <div className={`p-4 rounded-xl border ${
      isBest 
        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
        : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          {isBest ? <Crown className="text-yellow-600 ml-2" size={24} /> : <TrendingDown className="text-red-600 ml-2" size={24} />}
          <div className="font-semibold text-gray-900 text-lg">
            {isBest ? 'أفضل منصة أداءً' : 'المنصة الأقل أداءً'}
          </div>
        </div>
        <button
          onClick={onViewDetails}
          className="text-primary-600 hover:text-primary-800 p-1 rounded hover:bg-primary-50 transition-colors"
          title="عرض التفاصيل"
        >
          <Eye size={18} />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div 
            className="w-4 h-4 rounded-full ml-3 border-2 border-white shadow-sm"
            style={{ backgroundColor: performer.color }} 
          />
          <span className="font-bold text-gray-900 text-lg">{performer.name}</span>
        </div>
        <span className={`px-3 py-1 text-sm rounded-full border ${performer.performance.bgColor} ${performer.performance.color} ${performer.performance.borderColor}`}>
          <PerformanceIcon size={14} className="inline ml-1" />
          {performer.performance.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
        <div>
          <div className="text-gray-600">صافي الربح</div>
          <div className={`font-semibold ${isBest ? 'text-green-600' : 'text-red-600'}`}>
            {fmtMoney(performer.netProfit)}
          </div>
        </div>
        <div>
          <div className="text-gray-600">هامش الربح</div>
          <div className="font-semibold text-gray-900">
            {performer.profitMargin.toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-gray-600">نمو المبيعات</div>
          <div className={`font-semibold ${performer.gmvGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {performer.gmvGrowth >= 0 ? '+' : ''}{performer.gmvGrowth.toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-gray-600">النقاط</div>
          <div className="font-semibold text-gray-900">
            {performer.performanceScore}
          </div>
        </div>
      </div>
    </div>
  );
}

// مكون توزيع الأداء
function PerformanceDistribution({ platforms }) {
  const distribution = {
    excellent: platforms.filter(p => p.performance.level === 5).length,
    veryGood: platforms.filter(p => p.performance.level === 4).length,
    good: platforms.filter(p => p.performance.level === 3).length,
    acceptable: platforms.filter(p => p.performance.level === 2).length,
    needsImprovement: platforms.filter(p => p.performance.level === 1).length
  };

  const total = platforms.length;
  if (total === 0) return null;

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h4 className="font-semibold text-gray-900 mb-3">توزيع أداء المنصات</h4>
      <div className="space-y-2">
        {[
          { level: 'excellent', label: 'ممتاز', color: 'bg-green-500', count: distribution.excellent },
          { level: 'veryGood', label: 'جيد جداً', color: 'bg-blue-500', count: distribution.veryGood },
          { level: 'good', label: 'جيد', color: 'bg-yellow-500', count: distribution.good },
          { level: 'acceptable', label: 'مقبول', color: 'bg-orange-500', count: distribution.acceptable },
          { level: 'needsImprovement', label: 'يحتاج تحسين', color: 'bg-red-500', count: distribution.needsImprovement }
        ].map(item => (
          <div key={item.level} className="flex items-center justify-between">
            <div className="flex items-center w-32">
              <div className={`w-3 h-3 rounded-full ${item.color} ml-2`}></div>
              <span className="text-sm text-gray-600">{item.label}</span>
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${item.color}`}
                  style={{ width: `${(item.count / total) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="text-sm text-gray-600 w-16 text-left">
              {item.count} ({((item.count / total) * 100).toFixed(0)}%)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// مكون بطاقة المنصة المحسنة
function EnhancedPlatformCard({ platform, fmtMoney, fmtPercent, onViewDetails, onExportDetails }) {
  const [showMenu, setShowMenu] = useState(false);
  const PerformanceIcon = platform.performance.icon;

  return (
    <div className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all bg-white group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div 
            className="w-4 h-4 rounded-full ml-3 border-2 border-white shadow-sm"
            style={{ backgroundColor: platform.color }} 
          />
          <h3 className="font-semibold text-gray-900 text-lg">{platform.name}</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 text-xs rounded-full border ${platform.performance.bgColor} ${platform.performance.color} ${platform.performance.borderColor}`}>
            <PerformanceIcon size={12} className="inline ml-1" />
            {platform.performance.label}
          </span>
          
          {/* قائمة الإجراءات */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical size={16} />
            </button>
            
            {showMenu && (
              <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={() => {
                    onViewDetails();
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                >
                  <Eye size={14} />
                  عرض التفاصيل
                </button>
                <button
                  onClick={() => {
                    onExportDetails();
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Download size={14} />
                  تصدير التفاصيل
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* المؤشرات الرئيسية */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{fmtMoney(platform.gmv)}</div>
            <div className="text-xs text-gray-600">إجمالي المبيعات</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{fmtMoney(platform.netProfit)}</div>
            <div className="text-xs text-gray-600">صافي الربح</div>
          </div>
        </div>

        {/* المؤشرات الثانوية */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">الطلبات:</span>
            <span className="font-medium">{fmtNumber(platform.orders)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">هامش الربح:</span>
            <span className={`font-medium ${platform.performance.color}`}>
              {platform.profitMargin.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">متوسط الطلب:</span>
            <span className="font-medium">{fmtMoney(platform.avgOrderValue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">نمو المبيعات:</span>
            <span className={`font-medium ${platform.gmvGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {platform.gmvGrowth >= 0 ? '+' : ''}{platform.gmvGrowth.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* مؤشرات الجودة */}
        <div className="pt-3 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="flex items-center justify-center">
                <Star size={12} className="text-yellow-500 ml-1" />
                <span className="font-medium">{platform.avgRating}</span>
              </div>
              <div className="text-gray-500">التقييم</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{platform.avgDeliveryTime} د</div>
              <div className="text-gray-500">التوصيل</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{platform.avgCancellationRate}%</div>
              <div className="text-gray-500">الإلغاء</div>
            </div>
          </div>
        </div>

        {/* شريط تقدم الأداء */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>مؤشر الأداء</span>
            <span>{platform.performanceScore}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                platform.performance.level === 5 ? "bg-green-500" :
                platform.performance.level === 4 ? "bg-blue-500" :
                platform.performance.level === 3 ? "bg-yellow-500" :
                platform.performance.level === 2 ? "bg-orange-500" : "bg-red-500"
              }`}
              style={{ width: `${platform.performanceScore}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// مكون تفاصيل المنصة
function PlatformDetailsModal({ show, platform, onClose, fmtMoney, fmtPercent, fmtNumber }) {
  if (!show || !platform) return null;

  const PerformanceIcon = platform.performance.icon;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm grid place-items-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">تحليل أداء {platform.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* الملخص التنفيذي */}
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 p-4 rounded-xl border border-primary-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div 
                  className="w-6 h-6 rounded-full ml-3 border-2 border-white shadow-sm"
                  style={{ backgroundColor: platform.color }} 
                />
                <h4 className="text-xl font-bold text-gray-900">{platform.name}</h4>
              </div>
              <span className={`px-4 py-2 rounded-full border ${platform.performance.bgColor} ${platform.performance.color} ${platform.performance.borderColor}`}>
                <PerformanceIcon size={16} className="inline ml-1" />
                {platform.performance.label}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{fmtMoney(platform.gmv)}</div>
                <div className="text-sm text-gray-600">إجمالي المبيعات</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{fmtMoney(platform.netProfit)}</div>
                <div className="text-sm text-gray-600">صافي الربح</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{fmtNumber(platform.orders)}</div>
                <div className="text-sm text-gray-600">عدد الطلبات</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{platform.performanceScore}</div>
                <div className="text-sm text-gray-600">نقاط الأداء</div>
              </div>
            </div>
          </div>

          {/* الشبكة التفصيلية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* المؤشرات المالية */}
            <div className="space-y-4">
              <h5 className="font-semibold text-gray-900 border-b pb-2">المؤشرات المالية</h5>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">إجمالي المبيعات (GMV)</span>
                  <span className="font-semibold">{fmtMoney(platform.gmv)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">العمولات والرسوم</span>
                  <span className="text-red-600 font-semibold">-{fmtMoney(platform.commission)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ضريبة القيمة المضافة</span>
                  <span className="text-red-600 font-semibold">-{fmtMoney(platform.vat)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-600 font-semibold">صافي الربح</span>
                  <span className="text-green-600 font-bold">{fmtMoney(platform.netProfit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">هامش الربح</span>
                  <span className={`font-semibold ${platform.performance.color}`}>
                    {platform.profitMargin.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">متوسط قيمة الطلب</span>
                  <span className="font-semibold">{fmtMoney(platform.avgOrderValue)}</span>
                </div>
              </div>
            </div>

            {/* مؤشرات الأداء */}
            <div className="space-y-4">
              <h5 className="font-semibold text-gray-900 border-b pb-2">مؤشرات الأداء</h5>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">نمو المبيعات</span>
                  <span className={`font-semibold ${platform.gmvGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {platform.gmvGrowth >= 0 ? '+' : ''}{platform.gmvGrowth.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">نمو الطلبات</span>
                  <span className={`font-semibold ${platform.ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {platform.ordersGrowth >= 0 ? '+' : ''}{platform.ordersGrowth.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">معدل العمولة</span>
                  <span className="font-semibold">{platform.commissionRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">تقييم العملاء</span>
                  <span className="font-semibold text-amber-600">{platform.avgRating} / 5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">متوسط وقت التوصيل</span>
                  <span className="font-semibold">{platform.avgDeliveryTime} دقيقة</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">معدل الإلغاء</span>
                  <span className="font-semibold text-red-600">{platform.avgCancellationRate}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* التوصيات */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h5 className="font-semibold text-gray-900 mb-3">التوصيات والرؤى</h5>
            <div className="space-y-2 text-sm">
              {platform.performance.level <= 2 && (
                <p className="text-red-600">
                  ⚠️ هذه المنصة تحتاج إلى تحسين فوري في الأداء. راجع استراتيجية التسعير والعروض.
                </p>
              )}
              {platform.gmvGrowth < 0 && (
                <p className="text-orange-600">
                  📉 المبيعات في تراجع. فكر في عروض ترويجية أو تحسين الظهور على المنصة.
                </p>
              )}
              {platform.avgCancellationRate > 3 && (
                <p className="text-red-600">
                  🚫 معدل الإلغاء مرتفع. تحقق من أوقات التحضير وتواصل مع دعم المنصة.
                </p>
              )}
              {platform.avgRating < 4 && (
                <p className="text-yellow-600">
                  ⭐ التقييمات تحت المتوسط. راجع جودة المنتج وخدمة التوصيل.
                </p>
              )}
              {platform.performance.level >= 4 && (
                <p className="text-green-600">
                  ✅ أداء ممتاز! استمر في الاستراتيجية الحالية ووسع نطاق العمل على هذه المنصة.
                </p>
              )}
              {platform.profitMargin > 20 && (
                <p className="text-green-600">
                  💰 هامش ربح مرتفع. مثالي للتوسع وزيادة الاستثمار في التسويق.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}