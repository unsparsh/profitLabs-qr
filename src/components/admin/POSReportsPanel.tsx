import React, { useState } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface POSReportsPanelProps {
  hotelId: string;
  activeView: string;
}

export const POSReportsPanel: React.FC<POSReportsPanelProps> = ({ hotelId, activeView }) => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Mock data for POS reports
  const dailySalesData = [
    { date: '2024-01-10', sales: 15000, orders: 45, avgOrder: 333 },
    { date: '2024-01-11', sales: 18000, orders: 52, avgOrder: 346 },
    { date: '2024-01-12', sales: 12000, orders: 38, avgOrder: 316 },
    { date: '2024-01-13', sales: 22000, orders: 65, avgOrder: 338 },
    { date: '2024-01-14', sales: 19000, orders: 58, avgOrder: 328 },
    { date: '2024-01-15', sales: 25000, orders: 72, avgOrder: 347 },
  ];

  const monthlySalesData = [
    { month: 'Jan', sales: 450000, orders: 1200, growth: 12 },
    { month: 'Feb', sales: 520000, orders: 1350, growth: 15 },
    { month: 'Mar', sales: 480000, orders: 1280, growth: -8 },
    { month: 'Apr', sales: 580000, orders: 1450, growth: 21 },
    { month: 'May', sales: 620000, orders: 1520, growth: 7 },
    { month: 'Jun', sales: 550000, orders: 1380, growth: -11 },
  ];

  const productData = [
    { name: 'Coffee', sales: 85000, quantity: 850, percentage: 25 },
    { name: 'Food Items', sales: 120000, quantity: 480, percentage: 35 },
    { name: 'Beverages', sales: 65000, quantity: 650, percentage: 19 },
    { name: 'Desserts', sales: 45000, quantity: 300, percentage: 13 },
    { name: 'Others', sales: 25000, quantity: 200, percentage: 8 },
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const renderDailySalesReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Today's Sales</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹25,000</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">72</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Avg Order</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹347</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
              <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Growth</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">+15%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Sales Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailySalesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="sales" fill="#3B82F6" name="Sales (₹)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderMonthlySalesReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Revenue</h4>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">₹5.5L</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">-11% from last month</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Total Orders</h4>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">1,380</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Average 46 per day</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Best Month</h4>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">May</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">₹6.2L revenue</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Sales Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlySalesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2} name="Sales (₹)" />
            <Line type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} name="Orders" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderProductReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={productData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="percentage"
              >
                {productData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Products</h3>
          <div className="space-y-4">
            {productData.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full`} style={{ backgroundColor: COLORS[index] }}></div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{product.quantity} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">₹{product.sales.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{product.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'daily-sales':
        return renderDailySalesReport();
      case 'monthly-sales':
        return renderMonthlySalesReport();
      case 'product-reports':
        return renderProductReport();
      default:
        return renderDailySalesReport();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {activeView === 'daily-sales' ? 'Daily Sales Report' :
             activeView === 'monthly-sales' ? 'Monthly Sales Report' :
             activeView === 'product-reports' ? 'Product Reports' : 'POS Reports'}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">Analyze restaurant and bar sales performance</p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Apply Filter
          </button>
        </div>
      </div>

      {renderContent()}
    </div>
  );
};