'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type Language = 'en' | 'es'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Initialize from localStorage on first render
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Language
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'es')) {
        return savedLanguage
      }
    }
    return 'en'
  })

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang)
    }
  }

  const t = (key: string): string => {
    const translations = language === 'en' ? enTranslations : esTranslations
    const keys = key.split('.')
    let value: Record<string, unknown> | string = translations

    for (const k of keys) {
      if (typeof value === 'object' && value !== null) {
        value = value[k] as Record<string, unknown> | string
      } else {
        return key
      }
    }

    return typeof value === 'string' ? value : key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// English translations
const enTranslations = {
  common: {
    search: 'Search',
    cancel: 'Cancel',
    close: 'Close',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    create: 'Create',
    loading: 'Loading...',
    saving: 'Saving...',
    error: 'Error',
    success: 'Success',
    quantity: 'Quantity',
    status: 'Status',
    category: 'Category',
    location: 'Location',
    barcode: 'Barcode',
    name: 'Name',
    description: 'Description',
    back: 'Back',
  },
  nav: {
    dashboard: 'Dashboard',
    items: 'Items',
    locations: 'Locations',
    categories: 'Categories',
  },
  categories: {
    title: 'Categories',
    new: 'New Category',
    edit: 'Edit Category',
    name: 'Category Name',
    description: 'Description',
    create: 'Create Category',
    update: 'Update Category',
    delete: 'Delete Category',
    confirmDelete: 'Are you sure you want to delete this category?',
    itemCount: 'items',
    cannotDelete: 'Cannot delete category with associated items',
    manage: 'Manage categories and organize your inventory',
  },
  locations: {
    title: 'Locations',
    new: 'New Location',
    edit: 'Edit Location',
    name: 'Location Name',
    type: 'Type',
    description: 'Description',
    create: 'Create Location',
    update: 'Update Location',
    delete: 'Delete Location',
    confirmDelete: 'Are you sure you want to delete this location?',
    itemCount: 'items',
    cannotDelete: 'Cannot delete location with associated items',
    manage: 'Manage locations and warehouses',
    types: {
      WAREHOUSE: 'Warehouse',
      VEHICLE: 'Vehicle',
      SITE: 'Site'
    }
  },
  search: {
    placeholder: 'Search items...',
    scanBarcode: 'Scan Barcode',
  },
  scanner: {
    title: 'Barcode Scanner',
    instructions: 'Point your camera at a barcode',
    permissionDenied: 'Camera permissions are denied. Enable them in browser settings.',
    cameraError: 'Error accessing camera',
    retry: 'Retry',
    close: 'Close Scanner',
    initializing: 'Initializing camera...',
    unsupported: 'getUserMedia is not available in this browser',
    mobileDetected: 'Mobile detected: skipping permission pre-check',
  },
  scanResult: {
    found: 'Item Found!',
    notFound: 'Code Not Found',
    code: 'Code',
    viewDetails: 'View Details',
    createNew: 'Create New Item',
    addToExisting: 'Add to Existing Item',
    notRegistered: 'This code is not registered. What would you like to do?',
  },
  addBarcodeModal: {
    title: 'Add Code to Item',
    codeToAssign: 'Code to assign',
    searchPlaceholder: 'Search items...',
    noItems: 'No items found',
    hasCode: 'Already has code',
    assign: 'Assign Code',
  },
  newItem: {
    title: 'New Item',
    createItem: 'Create Item',
    name: 'Item Name',
    namePlaceholder: 'Enter item name',
    description: 'Description',
    descriptionPlaceholder: 'Enter description (optional)',
    category: 'Category',
    selectCategory: 'Select a category',
    location: 'Location',
    selectLocation: 'Select a location',
    quantity: 'Quantity',
    status: 'Status',
    barcode: 'Barcode',
    barcodePlaceholder: 'Enter or scan barcode',
    generateBarcode: 'Generate Barcode',
    scanBarcode: 'Scan Barcode',
    autoGenerate: 'Auto-generate unique barcode',
    materialConfig: 'Material Configuration',
    unitType: 'Unit Type',
    selectUnitType: 'Select unit type',
    unit: 'Unit',
    box: 'Box',
    unitsPerBox: 'Units per Box',
    totalUnits: 'Total units will be calculated automatically: Quantity × Units per Box',
    directUnits: 'Will be registered directly as individual units',
  },
  editItem: {
    title: 'Edit Item',
    updateItem: 'Update Item',
    currentBarcode: 'Current barcode',
    noBarcode: 'No barcode assigned',
    editingItem: 'Editing item',
  },
  itemDetails: {
    editItem: 'Edit Item',
    deleteItem: 'Delete Item',
    confirmDelete: 'Are you sure you want to delete this item?',
    sku: 'SKU',
    createdAt: 'Created',
    updatedAt: 'Updated',
  },
  serialNumbers: {
    title: 'Serial Numbers',
    add: 'Add Serial',
    empty: 'No serial numbers. Click "Add Serial" to add one or more.',
    serialNumber: 'Serial Number',
    tmoSerial: 'TMO Serial (T-Mobile)',
    siteKitSku: 'Site Kit SKU',
  },
  status: {
    AVAILABLE: 'Available',
    IN_USE: 'In Use',
    MAINTENANCE: 'Maintenance',
    LOST: 'Lost',
  },
  dashboard: {
    title: 'WIP Dashboard',
    welcome: 'Welcome to Integrale Inventory System',
    totalItems: 'Total Items',
    activeLocations: 'Active Locations',
    estimatedValue: 'Estimated Value',
    recentInventory: 'Recent Inventory',
    itemsByCategory: 'Items by Category',
    itemsByLocation: 'Items by Location',
    searchResults: 'Search Results',
    newArticle: 'New Item',
    viewByCategories: 'View by categories →',
    viewByLocations: 'View by locations →',
    noItems: 'No recent items. Add a new one to get started.',
    noSearchResults: 'No items found with',
    actions: 'Actions',
    units: 'units',
    unitsPerBox: 'u/box',
    boxes: 'boxes',
    management: 'Management',
  },
}

// Keep both locales in English for the offline tablet deployment.
const esTranslations = enTranslations
