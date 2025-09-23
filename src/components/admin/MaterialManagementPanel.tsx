import React, { useState } from 'react';
import { Package, Plus, Search, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';

interface MaterialManagementPanelProps {
  hotelId: string;
  activeView: string;
}

export const MaterialManagementPanel: React.FC<MaterialManagementPanelProps> = ({ hotelId, activeView }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for material management
  const inventoryItems = [
    {
      id: '1',
      name: 'Bed Sheets',
      category: 'Linen',
      currentStock: 45,
      minStock: 20,
      maxStock: 100,
      unit: 'pieces',
      costPerUnit: 500,
      supplier: 'Linen World',
      lastRestocked: '2024-01-10',
      status: 'adequate'
    },
    {
      id: '2',
      name: 'Toilet Paper',
      category: 'Amenities',
      currentStock: 8,
      minStock: 15,
      maxStock: 50,
      unit: 'rolls',
      costPerUnit: 25,
      supplier: 'Hygiene Plus',
      lastRestocked: '2024-01-12',
      status: 'low'
    },
    {
      id: '3',
      name: 'Cleaning Supplies',
      category: 'Housekeeping',
      currentStock: 0,
      minStock: 10,
      maxStock: 30,
      unit: 'bottles',
      costPerUnit: 150,
      supplier: 'Clean Pro',
      lastRestocked: '2024-01-05',
      status: 'out-of-stock'
    }
  ];

  const purchaseOrders = [
    {
      id: 'PO001',
      supplier: 'Linen World',
      items: [
        { name: 'Bed Sheets', quantity: 50, unitPrice: 500 },
        { name: 'Towels', quantity: 30, unitPrice: 300 }
      ],
      totalAmount: 34000,
      status: 'pending',
      orderDate: '2024-01-15',
      expectedDelivery: '2024-01-20'
    },
    {
      id: 'PO002',
      supplier: 'Hygiene Plus',
      items: [
        { name: 'Toilet Paper', quantity: 100, unitPrice: 25 },
        { name: 'Soap', quantity: 50, unitPrice: 40 }
      ],
      totalAmount: 4500,
      status: 'delivered',
      orderDate: '2024-01-12',
      expectedDelivery: '2024-01-15'
    }
  ];

  const suppliers = [
    {
      id: '1',
      name: 'Linen World',
      contact: '+91 9876543210',
      email: 'orders@linenworld.com',
      address: '123 Textile Street, Mumbai',
      categories: ['Linen', 'Bedding'],
      rating: 4.5,
      totalOrders: 25
    },
    {
      id: '2',
      name: 'Hygiene Plus',
      contact: '+91 9876543211',
      email: 'sales@hygieneplus.com',
      address: '456 Clean Avenue, Delhi',
      categories: ['Amenities', 'Cleaning'],
      rating: 4.2,
      totalOrders: 18
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'adequate':
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'low':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'out-of-stock':
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const renderInventoryView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{inventoryItems.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <TrendingDown className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {inventoryItems.filter(item => item.status === 'low').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Out of Stock</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {inventoryItems.filter(item => item.status === 'out-of-stock').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹2.5L</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inventory Items</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Min/Max</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cost/Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Supplier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {inventoryItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{item.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{item.currentStock} {item.unit}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{item.minStock}/{item.maxStock}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">₹{item.costPerUnit}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{item.supplier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPurchaseOrdersView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Purchase Orders</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          Create PO
        </button>
      </div>

      <div className="space-y-4">
        {purchaseOrders.map((order) => (
          <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{order.id}</h4>
                <p className="text-gray-600 dark:text-gray-300">Supplier: {order.supplier}</p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">₹{order.totalAmount.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Order Date: {new Date(order.orderDate).toLocaleDateString()}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Expected Delivery: {new Date(order.expectedDelivery).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Items: {order.items.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Quantity: {order.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Items:</h5>
              <div className="space-y-1">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">{item.name} x {item.quantity}</span>
                    <span className="text-gray-900 dark:text-white">₹{(item.quantity * item.unitPrice).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSuppliersView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Suppliers</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" />
          Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{supplier.name}</h4>
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-sm ${i < Math.floor(supplier.rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
                      ★
                    </span>
                  ))}
                  <span className="text-sm text-gray-600 dark:text-gray-300 ml-1">({supplier.rating})</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Orders</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{supplier.totalOrders}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 dark:text-gray-300">📞</span>
                <span className="text-gray-900 dark:text-white">{supplier.contact}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 dark:text-gray-300">✉️</span>
                <span className="text-gray-900 dark:text-white">{supplier.email}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-600 dark:text-gray-300">📍</span>
                <span className="text-gray-900 dark:text-white">{supplier.address}</span>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Categories:</p>
              <div className="flex flex-wrap gap-2">
                {supplier.categories.map((category, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                    {category}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'inventory-management':
        return renderInventoryView();
      case 'purchase-orders':
        return renderPurchaseOrdersView();
      case 'suppliers':
        return renderSuppliersView();
      default:
        return renderInventoryView();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Package className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {activeView === 'inventory-management' ? 'Inventory Management' :
             activeView === 'purchase-orders' ? 'Purchase Orders' :
             activeView === 'suppliers' ? 'Suppliers' : 'Material Management'}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">Manage inventory, orders, and suppliers</p>
        </div>
      </div>

      {renderContent()}
    </div>
  );
};