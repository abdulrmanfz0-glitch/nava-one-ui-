import { useState, useEffect } from 'react';
import { useBrand } from '@/contexts/BrandContext';
import { useNotification } from '@/contexts/NotificationContext';
import Card from '@/components/UI/Card';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import {
  Building2,
  Palette,
  Globe,
  MapPin,
  Phone,
  Mail,
  FileText,
  Save,
  Upload,
  Sparkles
} from 'lucide-react';

const BrandSettings = () => {
  const { brand, loading, updateBrand, createBrand, hasBrand } = useBrand();
  const { showNotification } = useNotification();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    legal_name: '',
    description: '',
    logo_url: '',
    primary_color: '#3B82F6',
    secondary_color: '#10B981',
    accent_color: '#F59E0B',
    email: '',
    phone: '',
    website: '',
    country: 'Saudi Arabia',
    headquarters_city: '',
    headquarters_address: '',
    industry: '',
    tax_id: '',
    registration_number: '',
    currency: 'SAR',
    timezone: 'Asia/Riyadh',
    language: 'en'
  });

  useEffect(() => {
    if (brand) {
      setFormData({
        name: brand.name || '',
        legal_name: brand.legal_name || '',
        description: brand.description || '',
        logo_url: brand.logo_url || '',
        primary_color: brand.primary_color || '#3B82F6',
        secondary_color: brand.secondary_color || '#10B981',
        accent_color: brand.accent_color || '#F59E0B',
        email: brand.email || '',
        phone: brand.phone || '',
        website: brand.website || '',
        country: brand.country || 'Saudi Arabia',
        headquarters_city: brand.headquarters_city || '',
        headquarters_address: brand.headquarters_address || '',
        industry: brand.industry || '',
        tax_id: brand.tax_id || '',
        registration_number: brand.registration_number || '',
        currency: brand.currency || 'SAR',
        timezone: brand.timezone || 'Asia/Riyadh',
        language: brand.language || 'en'
      });
    }
  }, [brand]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (hasBrand) {
        await updateBrand(formData);
        showNotification('Brand updated successfully', 'success');
      } else {
        await createBrand(formData);
        showNotification('Brand created successfully', 'success');
      }
    } catch (error) {
      showNotification(error.message || 'Failed to save brand', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg text-white">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Brand Identity
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your brand's identity and appearance across all branches
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Brand Information */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="w-5 h-5 text-primary-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Brand Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Brand Name *
              </label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your brand name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Legal Name
              </label>
              <Input
                type="text"
                name="legal_name"
                value={formData.legal_name}
                onChange={handleInputChange}
                placeholder="Legal business name"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of your brand"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Industry
              </label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Select industry</option>
                <option value="retail">Retail</option>
                <option value="restaurant">Restaurant</option>
                <option value="cafe">Café</option>
                <option value="hospitality">Hospitality</option>
                <option value="services">Services</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Logo URL
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  name="logo_url"
                  value={formData.logo_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/logo.png"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                >
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Brand Colors */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Palette className="w-5 h-5 text-primary-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Brand Colors
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Primary Color
              </label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  name="primary_color"
                  value={formData.primary_color}
                  onChange={handleInputChange}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.primary_color}
                  onChange={(e) => handleInputChange({ target: { name: 'primary_color', value: e.target.value }})}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Secondary Color
              </label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  name="secondary_color"
                  value={formData.secondary_color}
                  onChange={handleInputChange}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.secondary_color}
                  onChange={(e) => handleInputChange({ target: { name: 'secondary_color', value: e.target.value }})}
                  placeholder="#10B981"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Accent Color
              </label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  name="accent_color"
                  value={formData.accent_color}
                  onChange={handleInputChange}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.accent_color}
                  onChange={(e) => handleInputChange({ target: { name: 'accent_color', value: e.target.value }})}
                  placeholder="#F59E0B"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Color Preview */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Preview:</p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-12 h-12 rounded-lg shadow-md"
                  style={{ backgroundColor: formData.primary_color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Primary</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-12 h-12 rounded-lg shadow-md"
                  style={{ backgroundColor: formData.secondary_color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Secondary</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-12 h-12 rounded-lg shadow-md"
                  style={{ backgroundColor: formData.accent_color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Accent</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Phone className="w-5 h-5 text-primary-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Contact Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="contact@yourbrand.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone
              </label>
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+966 XX XXX XXXX"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Globe className="w-4 h-4 inline mr-1" />
                Website
              </label>
              <Input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://www.yourbrand.com"
              />
            </div>
          </div>
        </Card>

        {/* Business Address */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="w-5 h-5 text-primary-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Headquarters Location
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Country
              </label>
              <Input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                placeholder="Saudi Arabia"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                City
              </label>
              <Input
                type="text"
                name="headquarters_city"
                value={formData.headquarters_city}
                onChange={handleInputChange}
                placeholder="Riyadh"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address
              </label>
              <textarea
                name="headquarters_address"
                value={formData.headquarters_address}
                onChange={handleInputChange}
                placeholder="Full headquarters address"
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </Card>

        {/* Business Registration */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="w-5 h-5 text-primary-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Business Registration
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tax ID / VAT Number
              </label>
              <Input
                type="text"
                name="tax_id"
                value={formData.tax_id}
                onChange={handleInputChange}
                placeholder="Tax identification number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Registration Number
              </label>
              <Input
                type="text"
                name="registration_number"
                value={formData.registration_number}
                onChange={handleInputChange}
                placeholder="Business registration number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="SAR">SAR - Saudi Riyal</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="AED">AED - UAE Dirham</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Timezone
              </label>
              <select
                name="timezone"
                value={formData.timezone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="Asia/Riyadh">Asia/Riyadh</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={saving}
            className="min-w-[150px]"
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                {hasBrand ? 'Update Brand' : 'Create Brand'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BrandSettings;
