// SheetDB API configuration
const SHEETDB_API_URL = 'https://sheetdb.io/api/v1/16m83onxj2zt6';

// DOM elements
const form = document.getElementById('installationForm');
const recordIdField = document.getElementById('recordId');
const addItemBtn = document.getElementById('addItemBtn');
const itemsTable = document.getElementById('itemsTable');
const dateField = document.getElementById('date');
const showFormBtn = document.getElementById('showFormBtn');
const showDataBtn = document.getElementById('showDataBtn');
const formView = document.getElementById('formView');
const dataView = document.getElementById('dataView');
const refreshBtn = document.getElementById('refreshBtn');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const recordsList = document.getElementById('recordsList');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const loading = document.getElementById('loading');
const toast = document.getElementById('toast');
const viewModal = document.getElementById('viewModal');
const closeViewModal = document.getElementById('closeViewModal');
const closeViewModalBtn = document.getElementById('closeViewModalBtn');
const generatePdfBtn = document.getElementById('generatePdfBtn');

// Stats elements
const totalReports = document.getElementById('totalReports');
const totalCustomers = document.getElementById('totalCustomers');
const totalItems = document.getElementById('totalItems');
const totalEngineers = document.getElementById('totalEngineers');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

// Initialize the application
function initializeApp() {
    // Set current date as default for the date field only
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    
    dateField.value = today;
    
    // Hide form view and show data view by default
    formView.style.display = 'none';
    dataView.style.display = 'block';
    
    // Load records if there are any
    loadRecords();
}

// Set up event listeners
function setupEventListeners() {
    // Toggle between form and data views
    showFormBtn.addEventListener('click', showFormView);
    showDataBtn.addEventListener('click', showDataView);
    
    // Form actions
    addItemBtn.addEventListener('click', addItemRow);
    resetBtn.addEventListener('click', resetForm);
    form.addEventListener('submit', handleFormSubmit);
    
    // Data view actions
    refreshBtn.addEventListener('click', loadRecords);
    searchBtn.addEventListener('click', () => loadRecords());
    clearSearchBtn.addEventListener('click', clearSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            loadRecords();
        }
    });
    
    // Modal actions
    closeViewModal.addEventListener('click', () => closeModal(viewModal));
    closeViewModalBtn.addEventListener('click', () => closeModal(viewModal));
    generatePdfBtn.addEventListener('click', generatePdfFromModal);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === viewModal) {
            closeModal(viewModal);
        }
    });
}

// Show form view
function showFormView() {
    formView.style.display = 'block';
    dataView.style.display = 'none';
    showFormBtn.className = 'active-view';
    showDataBtn.className = 'inactive-view';
}

// Show data view
function showDataView() {
    formView.style.display = 'none';
    dataView.style.display = 'block';
    showFormBtn.className = 'inactive-view';
    showDataBtn.className = 'active-view';
    loadRecords();
}

// Show toast notification
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = 'toast show';
    if (type === 'error') {
        toast.classList.add('toast-error');
    } else {
        toast.classList.remove('toast-error');
    }
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Show loading indicator
function showLoading() {
    loading.style.display = 'flex';
}

// Hide loading indicator
function hideLoading() {
    loading.style.display = 'none';
}

// Add new item row
function addItemRow() {
    const tbody = itemsTable.querySelector('tbody');
    const rowCount = tbody.rows.length;
    
    // Limit to 5 items max
    if (rowCount >= 5) {
        showToast("Maximum 5 items allowed per installation", "error");
        return;
    }
    
    const newRow = tbody.insertRow();
    
    newRow.innerHTML = `
        <td><input type="text" name="sNo[]" value="${rowCount + 1}" readonly></td>
        <td><input type="text" name="itemDescription[]"></td>
        <td><input type="text" name="manufacturer[]"></td>
        <td><input type="text" name="serialNo[]"></td>
        <td><input type="text" name="modelNo[]"></td>
        <td><input type="number" name="quantity[]" min="1" value="1"></td>
        <td><button type="button" class="btn-delete btn-small" onclick="removeItem(this)"><i class="fas fa-trash"></i> Remove</button></td>
    `;
}

// Remove item row
function removeItem(button) {
    const tbody = itemsTable.querySelector('tbody');
    if (tbody.rows.length <= 1) {
        showToast("You need at least one item.", "error");
        return;
    }
    
    const row = button.closest('tr');
    row.parentNode.removeChild(row);
    
    // Update serial numbers
    Array.from(tbody.rows).forEach((row, index) => {
        row.cells[0].querySelector('input').value = index + 1;
    });
}

// Reset form
function resetForm() {
    recordIdField.value = '';
    
    // Set current date again after reset
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    dateField.value = today;
    
    // Reset items table to one row
    const tbody = itemsTable.querySelector('tbody');
    tbody.innerHTML = `
        <tr>
            <td><input type="text" name="sNo[]" value="1" readonly></td>
            <td><input type="text" name="itemDescription[]"></td>
            <td><input type="text" name="manufacturer[]"></td>
            <td><input type="text" name="serialNo[]"></td>
            <td><input type="text" name="modelNo[]"></td>
            <td><input type="number" name="quantity[]" min="1" value="1"></td>
            <td><button type="button" class="btn-delete btn-small" onclick="removeItem(this)"><i class="fas fa-trash"></i> Remove</button></td>
        </tr>
    `;
    
    showToast("Form has been reset");
}

// Generate a unique ID
function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Basic validation
    if (!form.checkValidity()) {
        showToast("Please fill in all required fields", "error");
        return;
    }
    
    showLoading();
    
    // Collect form data
    const formData = new FormData(form);
    
    // Generate ID if it's a new record
    let recordId = recordIdField.value;
    if (!recordId) {
        recordId = generateId();
    }
    
    const data = {
        id: recordId,
        date: formData.get('date'),
        customerName: formData.get('customerName'),
        address: formData.get('address'),
        city: formData.get('city'),
        customerContact: formData.get('customerContact'),
        invoiceNo: formData.get('invoiceNo') || '',
        invoiceDate: formData.get('invoiceDate') || '',
        installationDate: formData.get('installationDate') || '',
        engineerName: formData.get('engineerName') || '',
        engineerContact: formData.get('engineerContact') || '',
        warrantyPeriod: formData.get('warrantyPeriod') || '',
        demoGiven: formData.get('demoGiven') || 'No',
        trainingGiven: formData.get('trainingGiven') || 'No',
        eventStart: formData.get('eventStart') || '',
        eventEnd: formData.get('eventEnd') || ''
    };
    
    // Process items as array of objects
    const sNoValues = formData.getAll('sNo[]');
    const itemDescriptionValues = formData.getAll('itemDescription[]');
    const manufacturerValues = formData.getAll('manufacturer[]');
    const serialNoValues = formData.getAll('serialNo[]');
    const modelNoValues = formData.getAll('modelNo[]');
    const quantityValues = formData.getAll('quantity[]');
    
    const itemsArray = [];
    
    for (let i = 0; i < sNoValues.length; i++) {
        if (itemDescriptionValues[i] && itemDescriptionValues[i].trim() !== '') {
            itemsArray.push({
                sNo: sNoValues[i],
                itemDescription: itemDescriptionValues[i],
                manufacturer: manufacturerValues[i],
                serialNo: serialNoValues[i],
                modelNo: modelNoValues[i],
                quantity: quantityValues[i]
            });
        }
    }
    
    // Store items as a JSON string
    data.items = JSON.stringify(itemsArray);
    
    try {
        let response;
        
        // Check if we're updating an existing record or creating a new one
        if (recordIdField.value) {
            // Update existing record in SheetDB
            response = await fetch(`${SHEETDB_API_URL}/id/${encodeURIComponent(recordId)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data })
            });
            
            if (response.ok) {
                showToast('Data updated successfully in SheetDB!');
            } else {
                throw new Error('Failed to update record in SheetDB');
            }
        } else {
            // Create new record in SheetDB
            response = await fetch(SHEETDB_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data })
            });
            
            if (response.ok) {
                showToast('Data saved successfully to SheetDB!');
            } else {
                throw new Error('Failed to create record in SheetDB');
            }
        }
        
        // Also save to localStorage for fallback
        let records = JSON.parse(localStorage.getItem('installationReports') || '[]');
        
        if (recordIdField.value) {
            // Update existing record
            const index = records.findIndex(record => record.id === recordId);
            if (index !== -1) {
                records[index] = data;
            }
        } else {
            // Create new record
            records.push(data);
        }
        
        localStorage.setItem('installationReports', JSON.stringify(records));
        
        // Reset form and switch to data view
        resetFormAndSwitchToDataView();
        
    } catch (error) {
        console.error('Error saving data to SheetDB:', error);
        
        // Fallback to localStorage
        let records = JSON.parse(localStorage.getItem('installationReports') || '[]');
        
        if (recordIdField.value) {
            // Update existing record
            const index = records.findIndex(record => record.id === recordId);
            if (index !== -1) {
                records[index] = data;
                showToast('Data updated in localStorage (SheetDB unavailable)!', 'error');
            }
        } else {
            // Create new record
            records.push(data);
            showToast('Data saved in localStorage (SheetDB unavailable)!', 'error');
        }
        
        localStorage.setItem('installationReports', JSON.stringify(records));
        
        // Reset form and switch to data view
        resetFormAndSwitchToDataView();
    } finally {
        hideLoading();
    }
}

// Reset form and switch to data view
function resetFormAndSwitchToDataView() {
    // Reset form
    form.reset();
    recordIdField.value = '';
    
    // Set current date again after reset
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    dateField.value = today;
    
    // Reset items table to one row
    const tbody = itemsTable.querySelector('tbody');
    tbody.innerHTML = `
        <tr>
            <td><input type="text" name="sNo[]" value="1" readonly></td>
            <td><input type="text" name="itemDescription[]"></td>
            <td><input type="text" name="manufacturer[]"></td>
            <td><input type="text" name="serialNo[]"></td>
            <td><input type="text" name="modelNo[]"></td>
            <td><input type="number" name="quantity[]" min="1" value="1"></td>
            <td><button type="button" class="btn-delete btn-small" onclick="removeItem(this)"><i class="fas fa-trash"></i> Remove</button></td>
        </tr>
    `;
    
    // Switch to data view after successful submission
    showDataView();
    
    // Reload records to show the new/updated data
    loadRecords();
}

// Load records from storage
async function loadRecords() {
    showLoading();
    
    try {
        let records = [];
        
        // Try to fetch from SheetDB first
        try {
            const response = await fetch(SHEETDB_API_URL);
            if (response.ok) {
                records = await response.json();
                // Also update localStorage with the data from SheetDB
                localStorage.setItem('installationReports', JSON.stringify(records));
                showToast('Data loaded from SheetDB');
            } else {
                throw new Error('Failed to fetch from SheetDB');
            }
        } catch (error) {
            console.error('Error fetching from SheetDB:', error);
            // Fallback to localStorage
            records = JSON.parse(localStorage.getItem('installationReports') || '[]');
            showToast('Using localStorage data (SheetDB unavailable)', 'error');
        }
        
        displayRecords(records);
        updateStats(records);
    } catch (error) {
        console.error('Error loading records:', error);
        showToast('Error loading records. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Display records in the data view
function displayRecords(records) {
    recordsList.innerHTML = '';
    
    if (records.length === 0) {
        recordsList.innerHTML = `
            <div class="no-records">
                <i class="fas fa-inbox"></i>
                <h3>No Reports Found</h3>
                <p>Create your first installation report to get started</p>
            </div>
        `;
        return;
    }
    
    // Apply search filter if any
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        records = records.filter(record => 
            record.customerName.toLowerCase().includes(searchTerm) ||
            (record.invoiceNo && record.invoiceNo.toLowerCase().includes(searchTerm)) ||
            (record.engineerName && record.engineerName.toLowerCase().includes(searchTerm))
        );
        
        // Show message if no records match the search
        if (records.length === 0) {
            recordsList.innerHTML = `
                <div class="no-records">
                    <i class="fas fa-search"></i>
                    <h3>No Matching Reports</h3>
                    <p>No reports found matching your search criteria</p>
                </div>
            `;
            return;
        }
    }
    
    records.forEach(record => {
        const recordCard = document.createElement('div');
        recordCard.className = 'record-card';
        
        recordCard.innerHTML = `
            <div class="record-header">
                <h4>${record.customerName}</h4>
                <div class="record-actions">
                    <button class="btn-view btn-small view-record" data-id="${record.id}"><i class="fas fa-eye"></i> View</button>
                    <button class="btn-edit btn-small edit-record" data-id="${record.id}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn-pdf btn-small pdf-record" data-id="${record.id}"><i class="fas fa-file-pdf"></i> PDF</button>
                    <button class="btn-delete btn-small delete-record" data-id="${record.id}"><i class="fas fa-trash"></i> Delete</button>
                </div>
            </div>
            <div class="record-details">
                <div class="detail-item">
                    <div class="detail-label">Date</div>
                    <div>${record.date}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Invoice No</div>
                    <div>${record.invoiceNo || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Engineer</div>
                    <div>${record.engineerName || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">City</div>
                    <div>${record.city}</div>
                </div>
            </div>
        `;
        
        recordsList.appendChild(recordCard);
    });
    
    // Add event listeners to the action buttons
    document.querySelectorAll('.view-record').forEach(button => {
        button.addEventListener('click', () => viewRecord(button.getAttribute('data-id')));
    });
    
    document.querySelectorAll('.edit-record').forEach(button => {
        button.addEventListener('click', () => editRecord(button.getAttribute('data-id')));
    });
    
    document.querySelectorAll('.pdf-record').forEach(button => {
        button.addEventListener('click', () => generatePDF(button.getAttribute('data-id')));
    });
    
    document.querySelectorAll('.delete-record').forEach(button => {
        button.addEventListener('click', () => deleteRecord(button.getAttribute('data-id')));
    });
}

// Update statistics
function updateStats(records) {
    totalReports.textContent = records.length;
    
    // Count unique customers
    const uniqueCustomers = new Set(records.map(record => record.customerName));
    totalCustomers.textContent = uniqueCustomers.size;
    
    // Count total items
    let itemsCount = 0;
    records.forEach(record => {
        try {
            const items = JSON.parse(record.items || '[]');
            itemsCount += items.length;
        } catch (e) {
            console.error('Error parsing items:', e);
        }
    });
    totalItems.textContent = itemsCount;
    
    // Count unique engineers
    const engineers = records.map(record => record.engineerName).filter(name => name);
    const uniqueEngineers = new Set(engineers);
    totalEngineers.textContent = uniqueEngineers.size;
}

// View record details
function viewRecord(id) {
    const records = JSON.parse(localStorage.getItem('installationReports') || '[]');
    const record = records.find(r => r.id === id);
    
    if (!record) {
        showToast('Record not found', 'error');
        return;
    }
    
    // Populate view modal with record data
    document.getElementById('viewDate').textContent = record.date || 'N/A';
    document.getElementById('viewCustomerName').textContent = record.customerName || 'N/A';
    document.getElementById('viewAddress').textContent = record.address || 'N/A';
    document.getElementById('viewCity').textContent = record.city || 'N/A';
    document.getElementById('viewCustomerContact').textContent = record.customerContact || 'N/A';
    document.getElementById('viewInvoiceNo').textContent = record.invoiceNo || 'N/A';
    document.getElementById('viewInvoiceDate').textContent = record.invoiceDate || 'N/A';
    document.getElementById('viewInstallationDate').textContent = record.installationDate || 'N/A';
    document.getElementById('viewEngineerName').textContent = record.engineerName || 'N/A';
    document.getElementById('viewEngineerContact').textContent = record.engineerContact || 'N/A';
    document.getElementById('viewWarrantyPeriod').textContent = record.warrantyPeriod ? `${record.warrantyPeriod} months` : 'N/A';
    document.getElementById('viewDemoGiven').textContent = record.demoGiven || 'No';
    document.getElementById('viewTrainingGiven').textContent = record.trainingGiven || 'No';
    document.getElementById('viewEventStart').textContent = record.eventStart || 'N/A';
    document.getElementById('viewEventEnd').textContent = record.eventEnd || 'N/A';
    
    // Populate items table
    const itemsTableBody = document.querySelector('#viewItemsTable tbody');
    itemsTableBody.innerHTML = '';
    
    try {
        const items = JSON.parse(record.items || '[]');
        if (items.length > 0) {
            items.forEach(item => {
                const row = itemsTableBody.insertRow();
                row.innerHTML = `
                    <td>${item.sNo}</td>
                    <td>${item.itemDescription}</td>
                    <td>${item.manufacturer || 'N/A'}</td>
                    <td>${item.serialNo || 'N/A'}</td>
                    <td>${item.modelNo || 'N/A'}</td>
                    <td>${item.quantity}</td>
                `;
            });
        } else {
            itemsTableBody.innerHTML = '<tr><td colspan="6" class="no-items">No items found</td></tr>';
        }
    } catch (e) {
        console.error('Error parsing items:', e);
        itemsTableBody.innerHTML = '<tr><td colspan="6" class="no-items">Error loading items</td></tr>';
    }
    
    // Store the current record ID in the modal for PDF generation
    viewModal.setAttribute('data-current-id', id);
    
    // Show the modal
    viewModal.style.display = 'flex';
}

// Close modal
function closeModal(modal) {
    modal.style.display = 'none';
}

// Generate PDF from modal
function generatePdfFromModal() {
    const id = viewModal.getAttribute('data-current-id');
    if (id) {
        generatePDF(id);
    }
}

// Generate PDF
function generatePDF(id) {
    const records = JSON.parse(localStorage.getItem('installationReports') || '[]');
    const record = records.find(r => r.id === id);
    
    if (!record) {
        showToast('Record not found', 'error');
        return;
    }
    
    // Store the record data in localStorage to pass to the PDF page
    localStorage.setItem('pdfRecord', JSON.stringify(record));
    
    // Open the PDF page in a new tab
    window.open('pdf.html', '_blank');
}

// Edit record
function editRecord(id) {
    const records = JSON.parse(localStorage.getItem('installationReports') || '[]');
    const record = records.find(r => r.id === id);
    
    if (!record) {
        showToast('Record not found', 'error');
        return;
    }
    
    // Switch to form view
    showFormView();
    
    // Populate form with record data
    recordIdField.value = record.id;
    dateField.value = record.date;
    document.getElementById('customerName').value = record.customerName;
    document.getElementById('address').value = record.address;
    document.getElementById('city').value = record.city;
    document.getElementById('customerContact').value = record.customerContact;
    document.getElementById('invoiceNo').value = record.invoiceNo || '';
    document.getElementById('invoiceDate').value = record.invoiceDate || '';
    document.getElementById('installationDate').value = record.installationDate || '';
    document.getElementById('engineerName').value = record.engineerName || '';
    document.getElementById('engineerContact').value = record.engineerContact || '';
    document.getElementById('warrantyPeriod').value = record.warrantyPeriod || '';
    
    // Set radio buttons
    if (record.demoGiven === 'Yes') {
        document.getElementById('demoYes').checked = true;
    } else {
        document.getElementById('demoNo').checked = true;
    }
    
    if (record.trainingGiven === 'Yes') {
        document.getElementById('trainingYes').checked = true;
    } else {
        document.getElementById('trainingNo').checked = true;
    }
    
    document.getElementById('eventStart').value = record.eventStart || '';
    document.getElementById('eventEnd').value = record.eventEnd || '';
    
    // Populate items table
    const tbody = itemsTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    try {
        const items = JSON.parse(record.items || '[]');
        if (items.length > 0) {
            items.forEach((item, index) => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td><input type="text" name="sNo[]" value="${index + 1}" readonly></td>
                    <td><input type="text" name="itemDescription[]" value="${item.itemDescription}"></td>
                    <td><input type="text" name="manufacturer[]" value="${item.manufacturer || ''}"></td>
                    <td><input type="text" name="serialNo[]" value="${item.serialNo || ''}"></td>
                    <td><input type="text" name="modelNo[]" value="${item.modelNo || ''}"></td>
                    <td><input type="number" name="quantity[]" min="1" value="${item.quantity || 1}"></td>
                    <td><button type="button" class="btn-delete btn-small" onclick="removeItem(this)"><i class="fas fa-trash"></i> Remove</button></td>
                `;
            });
        } else {
            // Add at least one empty row
            tbody.innerHTML = `
                <tr>
                    <td><input type="text" name="sNo[]" value="1" readonly></td>
                    <td><input type="text" name="itemDescription[]"></td>
                    <td><input type="text" name="manufacturer[]"></td>
                    <td><input type="text" name="serialNo[]"></td>
                    <td><input type="text" name="modelNo[]"></td>
                    <td><input type="number" name="quantity[]" min="1" value="1"></td>
                    <td><button type="button" class="btn-delete btn-small" onclick="removeItem(this)"><i class="fas fa-trash"></i> Remove</button></td>
                </tr>
            `;
        }
    } catch (e) {
        console.error('Error parsing items:', e);
        // Add at least one empty row
        tbody.innerHTML = `
            <tr>
                <td><input type="text" name="sNo[]" value="1" readonly></td>
                <td><input type="text" name="itemDescription[]"></td>
                <td><input type="text" name="manufacturer[]"></td>
                <td><input type="text" name="serialNo[]"></td>
                <td><input type="text" name="modelNo[]"></td>
                <td><input type="number" name="quantity[]" min="1" value="1"></td>
                <td><button type="button" class="btn-delete btn-small" onclick="removeItem(this)"><i class="fas fa-trash"></i> Remove</button></td>
            </tr>
        `;
    }
    
    showToast('Record loaded for editing');
}

// Delete record
async function deleteRecord(id) {
    if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
        return;
    }
    
    showLoading();
    
    try {
        // Try to delete from SheetDB first
        try {
            const response = await fetch(`${SHEETDB_API_URL}/id/${encodeURIComponent(id)}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete from SheetDB');
            }
        } catch (error) {
            console.error('Error deleting from SheetDB:', error);
            showToast('Error deleting from SheetDB. Using localStorage.', 'error');
        }
        
        // Delete from localStorage
        let records = JSON.parse(localStorage.getItem('installationReports') || '[]');
        records = records.filter(record => record.id !== id);
        localStorage.setItem('installationReports', JSON.stringify(records));
        
        showToast('Record deleted successfully');
        loadRecords();
    } catch (error) {
        console.error('Error deleting record:', error);
        showToast('Error deleting record. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Clear search
function clearSearch() {
    searchInput.value = '';
    loadRecords();
}