"use client"

import { useState, useEffect, useCallback } from "react"
import CustomerForm from "../../components/customer_components/CustomerForm"
import CustomerTable from "../../components/customer_components/CustomerTable"
import CustomerFilter from "../../components/customer_components/CustomerFilter"
import { FaUsers, FaPlus, FaExclamationCircle } from "react-icons/fa"
import API_URL from "../../utils/apiConfig"
import "./CustomerManagement.css";

const CustomerManagement = ({ darkMode = false }) => {
  const [customers, setCustomers] = useState([])
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState({})
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)

  // Fetch customers with optional filtering
  const fetchCustomers = useCallback(async (filterParams = {}) => {
    setIsLoading(true)
    setError(null)

    try {
      // Convert filter object to query string
      const queryString = new URLSearchParams(filterParams).toString()
      const response = await fetch(`${API_URL}/api/customers${queryString ? `?${queryString}` : ""}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("auth-token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch customers")
      }

      const data = await response.json()
      setCustomers(data.customers || [])
    } catch (err) {
      console.error("Failed to fetch customers", err)
      setError(err.message)
      setCustomers([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle form submission (add/update)
  const handleFormSubmit = async (customerData) => {
    try {
      const response = await fetch(`${API_URL}/api/customers/add-or-update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("auth-token")}`,
        },
        body: JSON.stringify(customerData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to save customer")
      }

      // Refresh customer list
      fetchCustomers(filter)

      // Reset form and editing state
      setEditingCustomer(null)
      setIsAddingCustomer(false)
    } catch (err) {
      console.error("Failed to save customer", err)
      setError(err.message)
    }
  }

  // Handle customer deletion
  const handleDeleteCustomer = async (accountNumber) => {
    try {
      const response = await fetch(`${API_URL}/api/customers/${accountNumber}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("auth-token")}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || "Failed to delete customer")
      }

      // Refresh customer list
      fetchCustomers(filter)
    } catch (err) {
      console.error("Failed to delete customer", err)
      setError(err.message)
    }
  }

  // Handle filter changes
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    fetchCustomers(newFilter)
  }

  // Initial fetch
  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // Reset editing state when closing form
  const handleCancelEdit = () => {
    setEditingCustomer(null)
    setIsAddingCustomer(false)
  }

  return (
    <div className={`customer-management-container ${darkMode ? "dark-mode" : ""}`}>
      <div className="customer-management-header">
        <h2>
          <FaUsers className="customer-management-header-icon" />
          Customer Management
        </h2>
        <div className="customer-actions">
          <button
            className="add-customer-btn"
            onClick={() => {
              setIsAddingCustomer(true)
              setEditingCustomer(null)
            }}
          >
            <FaPlus style={{ marginRight: "8px" }} /> Add Customer
          </button>
        </div>
      </div>

      {/* Error Handling */}
      {error && (
        <div className="error-alert" role="alert">
          <FaExclamationCircle className="error-alert-icon" size={20} />
          <div className="error-alert-content">
            <strong>Error: </strong>
            <span>{error}</span>
          </div>
          <button className="error-alert-close" onClick={() => setError(null)} aria-label="Close">
            &times;
          </button>
        </div>
      )}

      {/* Customer Form (for adding/editing) */}
      {(isAddingCustomer || editingCustomer) && (
        <CustomerForm onSubmit={handleFormSubmit} initialData={editingCustomer} onCancel={handleCancelEdit} />
      )}

      {/* Customer Filter */}
      <CustomerFilter onFilterChange={handleFilterChange} currentFilter={filter} />

      {/* Customer Table */}
      <CustomerTable
        data={customers}
        isLoading={isLoading}
        onEdit={(customer) => {
          setEditingCustomer(customer)
          setIsAddingCustomer(false)
        }}
        onDelete={handleDeleteCustomer}
      />
    </div>
  )
}

export default CustomerManagement;