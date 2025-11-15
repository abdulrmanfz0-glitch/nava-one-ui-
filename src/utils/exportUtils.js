// src/utils/exportUtils.js
import { saveAs } from 'file-saver';

// تنسيق الأرقام والعملات
export const formatters = {
  formatMoney: (amount, currency = 'SAR') => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount || 0);
  },

  formatNumber: (number) => {
    return new Intl.NumberFormat('ar-SA').format(number || 0);
  },

  formatPercent: (number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format((number || 0) / 100);
  },

  formatDate: (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  },

  formatDateTime: (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

// أدوات التصدير إلى CSV
export const csvUtils = {
  exportToCSV(data, filename = 'data', options = {}) {
    try {
      const {
        headers = null,
        delimiter = ',',
        includeHeaders = true
      } = options;

      // تحديد الهيدرات
      const actualHeaders = headers || Object.keys(data[0] || {});
      
      // إنشاء محتوى CSV
      const csvContent = [
        // الهيدرات (إذا مطلوب)
        includeHeaders ? actualHeaders.join(delimiter) : null,
        
        // البيانات
        ...data.map(row => 
          actualHeaders.map(header => {
            const value = row[header];
            // معالجة القيم الخاصة
            if (value === null || value === undefined) return '';
            const stringValue = String(value).replace(/"/g, '""');
            return `"${stringValue}"`;
          }).join(delimiter)
        )
      ].filter(Boolean).join('\n');

      // إنشاء الملف وتنزيله
      const blob = new Blob(['\uFEFF' + csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.csv`);

      return { success: true, filename: `${filename}.csv` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // تصدير بيانات محددة مع تحويلات
  exportDataToCSV(data, columns, filename = 'export') {
    const formattedData = data.map(item => {
      const row = {};
      columns.forEach(col => {
        let value = item[col.key];
        
        // تطبيق المُنسق إذا موجود
        if (col.formatter) {
          value = col.formatter(value, item);
        }
        
        // استخدام الاسم المعروض للعمود
        row[col.label || col.key] = value;
      });
      return row;
    });

    return this.exportToCSV(formattedData, filename);
  }
};

// أدوات التصدير إلى PDF (باستخدام jsPDF)
export const pdfUtils = {
  async exportToPDF(elementId, filename = 'document', options = {}) {
    try {
      const { 
        title = 'تقرير NAVA',
        orientation = 'portrait',
        format = 'a4'
      } = options;

      // تحميل مكتبة jsPDF ديناميكياً
      const { jsPDF } = await import('jspdf');
      
      // إنشاء مستند PDF جديد
      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format
      });

      // إضافة عنوان
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(title, 105, 20, { align: 'center' });

      // إضافة تاريخ التصدير
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(
        `تم التصدير في: ${new Date().toLocaleDateString('ar-SA')}`,
        105,
        30,
        { align: 'center' }
      );

      // محاولة التقاط العنصر إذا كان موجوداً
      if (elementId && typeof window !== 'undefined') {
        const element = document.getElementById(elementId);
        // يمكن إضافة مكتبة html2canvas هنا لالتقاط screenshots
      }

      // حفظ الملف
      doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);

      return { success: true, filename: `${filename}.pdf` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // إنشاء تقرير جدولي
  async exportTableToPDF(headers, data, filename = 'table') {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // إعداد الجدول
      const tableColumn = headers.map(h => h.label || h.key);
      const tableRows = data.map(item => 
        headers.map(header => {
          let value = item[header.key];
          if (header.formatter) {
            value = header.formatter(value, item);
          }
          return value || '';
        })
      );

      // إضافة الجدول إلى PDF
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        styles: { font: 'Helvetica', fontSize: 10 },
        headStyles: { fillColor: [0, 136, 255] }, // لون NAVA الأزرق
        margin: { top: 20 }
      });

      doc.save(`${filename}.pdf`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// أدوات مساعدة عامة
export const generalUtils = {
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // تحميل الصور
  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  },

  // تنزيل البيانات كملف JSON
  exportToJSON(data, filename = 'data') {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      saveAs(blob, `${filename}.json`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// التصدير الرئيسي
export const exportUtils = {
  ...formatters,
  ...csvUtils,
  ...pdfUtils,
  ...generalUtils,

  // تصدير شامل لجميع الصيغ
  exportMultipleFormats(data, baseFilename, options = {}) {
    const formats = options.formats || ['csv', 'pdf', 'json'];
    const results = [];

    formats.forEach(format => {
      switch (format) {
        case 'csv':
          results.push(this.exportToCSV(data, baseFilename));
          break;
        case 'pdf':
          results.push(this.exportToPDF(null, baseFilename));
          break;
        case 'json':
          results.push(this.exportToJSON(data, baseFilename));
          break;
      }
    });

    return results;
  }
};

// 🔥 أضف هذا في النهاية للتوافق مع TasksManagement.jsx:
export default exportUtils;