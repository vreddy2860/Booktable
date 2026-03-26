import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useAuth } from '../../contexts/AuthContext';

const Tables = () => {
  const { user } = useAuth();
  
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form state
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    table_number: '',
    capacity: 2
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  
  // Fetch restaurant manager's restaurants and tables
  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setLoading(true);
        
        // Get user's restaurants
        const restaurantsResponse = await api.restaurants.getList({ manager: user.id });
        
        if (restaurantsResponse.data.length > 0) {
          const userRestaurants = restaurantsResponse.data;
          setRestaurants(userRestaurants);
          
          // Get primary restaurant for manager
          const primaryRestaurant = userRestaurants[0];
          setSelectedRestaurant(primaryRestaurant);
          
          // Get restaurant tables
          const tablesResponse = await api.restaurants.getTables(primaryRestaurant.id);
          setTables(tablesResponse.data);
        } else {
          setError('You need to create a restaurant before adding tables.');
        }
      } catch (err) {
        console.error('Error fetching tables data:', err);
        setError('Failed to load tables. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRestaurantData();
  }, [user]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) : value
    }));
  };
  
  // Reset form state
  const resetForm = () => {
    setFormData({
      table_number: '',
      capacity: 2
    });
    setEditingTable(null);
    setFormErrors({});
  };
  
  // Edit a table
  const handleEditTable = (table) => {
    setFormData({
      table_number: table.table_number,
      capacity: table.capacity
    });
    setEditingTable(table.id);
    // Scroll to form
    document.getElementById('table-form').scrollIntoView({ behavior: 'smooth' });
  };
  
  // Delete a table
  const handleDeleteTable = async (tableId) => {
    if (!window.confirm('Are you sure you want to delete this table? This cannot be undone.')) {
      return;
    }
    
    try {
      await api.restaurants.deleteTable(selectedRestaurant.id, tableId);
      // Update local state
      setTables(prev => prev.filter(table => table.id !== tableId));
      setSuccess('Table deleted successfully.');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting table:', err);
      setError('Failed to delete table. It may have existing bookings.');
    }
  };
  
  // Validate form data
  const validateForm = () => {
    const errors = {};
    
    if (!formData.table_number.trim()) {
      errors.table_number = 'Table number is required';
    }
    
    if (formData.capacity < 1) {
      errors.capacity = 'Capacity must be at least 1';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      let response;
      
      if (editingTable) {
        // Update existing table
        response = await api.restaurants.updateTable(
          selectedRestaurant.id,
          editingTable,
          formData
        );
        
        // Update local state
        setTables(prev => 
          prev.map(table => 
            table.id === editingTable ? response.data : table
          )
        );
        
        setSuccess('Table updated successfully.');
      } else {
        // Create new table
        response = await api.restaurants.addTable(
          selectedRestaurant.id,
          formData
        );
        
        // Update local state
        setTables(prev => [...prev, response.data]);
        setSuccess('Table added successfully.');
      }
      
      // Reset form
      resetForm();
    } catch (err) {
      console.error('Error saving table:', err);
      let errorMessage = 'Failed to save table. Please try again.';
      
      if (err.response && err.response.data) {
        if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (typeof err.response.data === 'object') {
          // Format field errors
          const fieldErrors = Object.entries(err.response.data)
            .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
            .join('; ');
          
          errorMessage = `Validation error: ${fieldErrors}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="text-center">
          <div className="spinner-border text-red-600" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading tables...</p>
        </div>
      </div>
    );
  }
  
  if (!selectedRestaurant) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6" role="alert">
          <p>You need to create a restaurant before managing tables.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Manage Tables</h1>
      <p className="text-gray-600 mb-8">
        Configure tables and seating capacity for {selectedRestaurant.name}.
      </p>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6" role="alert">
          <p>{success}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Table List */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Restaurant Tables</h2>
            </div>
            
            <div className="p-6">
              {tables.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Table Number
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Capacity
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tables.map(table => (
                        <tr key={table.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{table.table_number}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {table.capacity} {table.capacity === 1 ? 'person' : 'people'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              onClick={() => handleEditTable(table)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteTable(table.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">No tables added yet. Add your first table using the form.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Add/Edit Table Form */}
        <div>
          <div id="table-form" className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">
                {editingTable ? 'Edit Table' : 'Add New Table'}
              </h2>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="table_number" className="block text-sm font-medium text-gray-700 mb-1">
                      Table Number/Name *
                    </label>
                    <input
                      type="text"
                      id="table_number"
                      name="table_number"
                      value={formData.table_number}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border ${formErrors.table_number ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                      placeholder="e.g. Table 1, Window Table, etc."
                    />
                    {formErrors.table_number && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.table_number}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                      Seating Capacity *
                    </label>
                    <input
                      type="number"
                      id="capacity"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      min="1"
                      max="20"
                      className={`w-full px-3 py-2 border ${formErrors.capacity ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                    />
                    {formErrors.capacity && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.capacity}</p>
                    )}
                  </div>
                  
                  <div className="pt-4 flex items-center justify-between">
                    {editingTable && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button
                      type="submit"
                      className="ml-auto bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition duration-300 inline-flex items-center"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {editingTable ? 'Updating...' : 'Adding...'}
                        </>
                      ) : (
                        <>{editingTable ? 'Update Table' : 'Add Table'}</>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
          
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h3 className="text-blue-800 font-medium mb-2">Table Management Tips</h3>
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• Use clear table numbers or names that are easy to identify.</li>
              <li>• Set accurate seating capacity to ensure proper booking allocation.</li>
              <li>• Add tables for all available seating options (indoor, outdoor, etc).</li>
              <li>• Tables with existing bookings cannot be deleted.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tables;