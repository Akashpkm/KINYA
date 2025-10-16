// SheetDB API URL
const SHEETDB_API_URL = 'https://sheetdb.io/api/v1/e45n3b7ddyebf';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set default date to today
    document.getElementById('date').valueAsDate = new Date();
    
    // Generate CSR No
    generateNextCSRNo();
    
    // Update navigation dropdown based on active tab
    document.getElementById('navSelect').value = 'formTab';
});

// Function to update stats
async function updateStats() {
    try {
        const response = await fetch(SHEETDB_API_URL);
        const data = await response.json();
        
        // Calculate stats
        const total = data.length;
        const open = data.filter(report => !report.closedDate).length;
        const warranty = data.filter(report => report.serviceType === 'WARRANTY SERVICE').length;
        
        // Calculate closed this month
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const closedThisMonth = data.filter(report => {
            if (!report.closedDate) return false;
            const closedDate = new Date(report.closedDate);
            return closedDate.getMonth() === thisMonth && closedDate.getFullYear() === thisYear;
        }).length;
        
        // Update UI
        document.getElementById('totalReports').textContent = total;
        document.getElementById('openReports').textContent = open;
        document.getElementById('warrantyServices').textContent = warranty;
        document.getElementById('closedThisMonth').textContent = closedThisMonth;
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Function to update status based on closed date
function updateStatusBasedOnClosedDate() {
    const closedDate = document.getElementById('closedDate').value;
    // This function will be called when editing a report and the closed date is changed
    // The status in the table will update automatically when the reports are reloaded
}

// Function to toggle SheetDB info panel
function toggleSheetDBInfo() {
    const infoPanel = document.getElementById('sheetdbInfo');
    infoPanel.classList.toggle('show');
}

// Function to generate next CSR No
async function generateNextCSRNo() {
    try {
        const response = await fetch(SHEETDB_API_URL);
        const data = await response.json();
        
        // Find the highest CSR number
        let maxCSR = 0;
        data.forEach(report => {
            if (report.csrNo) {
                // Extract numeric part from CSR No (e.g., "001" -> 1)
                const csrNum = parseInt(report.csrNo.replace(/^0+/, '')) || 0;
                if (csrNum > maxCSR) {
                    maxCSR = csrNum;
                }
            }
        });
        
        // Generate next CSR No with leading zeros
        const nextCSR = (maxCSR + 1).toString().padStart(3, '0');
        document.getElementById('csrNo').value = nextCSR;
    } catch (error) {
        console.error('Error generating CSR No:', error);
        // Fallback to a random number if API call fails
        document.getElementById('csrNo').value = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    }
}

// Function to switch tabs
function openTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabId).classList.add('active');
    
    // Update navigation dropdown
    document.getElementById('navSelect').value = tabId;
    
    // Show/hide stats container based on active tab
    if (tabId === 'dataTab') {
        document.getElementById('statsContainer').style.display = 'grid';
        loadServiceReports();
        updateStats();
    } else {
        document.getElementById('statsContainer').style.display = 'none';
    }
}

// Function to add new spare row
function addSpareRow() {
    const tableBody = document.getElementById('sparesTableBody');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td><input type="text" name="spareName[]" placeholder="Spare part name"></td>
        <td><input type="number" name="spareQuantity[]" placeholder="Qty" min="1" class="number-input"></td>
        <td><input type="number" name="spareCost[]" placeholder="Cost" min="0" step="0.01" class="number-input"></td>
        <td><button type="button" class="delete-btn" onclick="deleteSpareRow(this)"><i class="fas fa-trash"></i></button></td>
    `;
    
    tableBody.appendChild(newRow);
}

// Function to delete spare row
function deleteSpareRow(button) {
    const row = button.closest('tr');
    row.remove();
}

// Function to reset the form
function resetForm() {
    if (confirm('Are you sure you want to reset the form? All data will be lost.')) {
        document.getElementById('serviceForm').reset();
        document.getElementById('recordId').value = '';
        const tableBody = document.getElementById('sparesTableBody');
        
        // Remove all spare rows except the first one
        while (tableBody.rows.length > 1) {
            tableBody.deleteRow(1);
        }
        
        // Set default date to today
        document.getElementById('date').valueAsDate = new Date();
        
        // Generate new CSR No
        generateNextCSRNo();
        
        showNotification('Form has been reset successfully!', 'success');
    }
}

// Function to show notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    notification.className = 'notification';
    
    if (type === 'error') {
        notification.classList.add('error');
    }
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Function to load service reports from SheetDB
async function loadServiceReports() {
    try {
        const response = await fetch(SHEETDB_API_URL);
        const data = await response.json();
        
        const tableBody = document.getElementById('serviceReportsTable');
        tableBody.innerHTML = '';
        
        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No service reports found</td></tr>';
            return;
        }
        
        // Sort data by date descending (newest first)
        data.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        data.forEach(report => {
            // Status is now based on whether closedDate has a value
            const status = report.closedDate ? 'Closed' : 'Open';
            const statusClass = report.closedDate ? 'status-closed' : 'status-open';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${report.csrNo || 'N/A'}</td>
                <td>${report.date || 'N/A'}</td>
                <td>${report.customerName || 'N/A'}</td>
                <td>${report.equipmentName || 'N/A'}</td>
                <td><span class="status-badge status-${report.serviceType ? report.serviceType.toLowerCase().replace(/\s+/g, '-') : 'unknown'}">${report.serviceType || 'N/A'}</span></td>
                <td>${report.engineerName || 'N/A'}</td>
                <td><span class="status-badge ${statusClass}"><span class="status-indicator"></span>${status}</span></td>
                <td class="action-cell">
                    <button class="btn btn-success" onclick="viewReport('${report.id}')"><i class="fas fa-eye"></i> View</button>
                    <button class="btn btn-info" onclick="editReport('${report.id}')"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn btn-warning" onclick="generatePDF('${report.id}')"><i class="fas fa-file-pdf"></i> PDF</button>
                    <button class="btn btn-danger" onclick="deleteReport('${report.id}')"><i class="fas fa-trash"></i> Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading service reports:', error);
        showNotification('Error loading service reports', 'error');
    }
}

// Function to view a report
async function viewReport(id) {
    try {
        const response = await fetch(`${SHEETDB_API_URL}/search?id=${id}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.length === 0) {
            showNotification('Report not found', 'error');
            return;
        }
        
        const report = data[0];
        
        document.getElementById('modalTitle').textContent = `Service Report: ${report.csrNo || 'N/A'}`;
        
        let modalContent = `
            <div class="two-column-grid">
                <div class="detail-card">
                    <h3 class="detail-card-title"><i class="fas fa-info-circle"></i> BASIC INFORMATION</h3>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label"><i class="fas fa-hashtag"></i> CSR No</div>
                        <div class="modal-detail-value">${report.csrNo || 'N/A'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label"><i class="fas fa-calendar"></i> Date</div>
                        <div class="modal-detail-value">${report.date || 'N/A'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label"><i class="fas fa-user"></i> Customer Name</div>
                        <div class="modal-detail-value">${report.customerName || 'N/A'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label"><i class="fas fa-map-marker"></i> Address</div>
                        <div class="modal-detail-value">${report.address || 'N/A'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label"><i class="fas fa-city"></i> City</div>
                        <div class="modal-detail-value">${report.city || 'N/A'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label"><i class="fas fa-phone"></i> Contact No</div>
                        <div class="modal-detail-value">${report.contactNo || 'N/A'}</div>
                    </div>
                </div>
                
                <div class="detail-card">
                    <h3 class="detail-card-title"><i class="fas fa-toolbox"></i> EQUIPMENT DETAILS</h3>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label"><i class="fas fa-tools"></i> Equipment Name</div>
                        <div class="modal-detail-value">${report.equipmentName || 'N/A'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label"><i class="fas fa-barcode"></i> Serial No</div>
                        <div class="modal-detail-value">${report.serialNo || 'N/A'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label"><i class="fas fa-industry"></i> Manufacturer</div>
                        <div class="modal-detail-value">${report.manufacturer || 'N/A'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label"><i class="fas fa-cube"></i> Model</div>
                        <div class="modal-detail-value">${report.model || 'N/A'}</div>
                    </div>
                </div>
            </div>
            
            <div class="detail-card">
                <h3 class="detail-card-title"><i class="fas fa-tools"></i> SERVICE DETAILS</h3>
                <div class="two-column-grid">
                    <div class="modal-detail-item">
                        <div class="modal-detail-label"><i class="fas fa-exclamation-triangle"></i> Customer Problem</div>
                        <div class="modal-detail-value">${report.customerProblem || 'N/A'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label"><i class="fas fa-stethoscope"></i> Diagnosis & Findings</div>
                        <div class="modal-detail-value">${report.diagnosisFindings || 'N/A'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label"><i class="fas fa-wrench"></i> Rectification</div>
                        <div class="modal-detail-value">${report.rectification || 'N/A'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label"><i class="fas fa-cog"></i> Service Type</div>
                        <div class="modal-detail-value">${report.serviceType || 'N/A'}</div>
                    </div>
                </div>
            </div>
      `;
        
        // Add spares information if available
        if (report.spareNames && report.spareNames !== 'N/A') {
            modalContent += `
                <div class="detail-card">
                    <h3 class="detail-card-title"><i class="fas fa-cogs"></i> SPARES REPLACED</h3>
                    <div class="spares-list">
                        <div class="spares-list-item spares-list-header">
                            <div>Spare Part</div>
                            <div>Quantity</div>
                            <div>Cost</div>
                        </div>
            `;
            
            // Safely handle spares data
            const spareNames = (report.spareNames || '').split(', ');
            const spareQuantities = (report.spareQuantities || '').split(', ');
            const spareCosts = (report.spareCosts || '').split(', ');
            
            for (let i = 0; i < spareNames.length; i++) {
                if (spareNames[i] && spareNames[i].trim() !== '') {
                    modalContent += `
                        <div class="spares-list-item">
                            <div>${spareNames[i] || 'N/A'}</div>
                            <div>${spareQuantities[i] || 'N/A'}</div>
                            <div>${spareCosts[i] ? '$' + spareCosts[i] : 'N/A'}</div>
                        </div>
                    `;
                }
            }
            
            modalContent += `</div></div>`;
        }
        
        // Add event handling information
        modalContent += `
            <div class="detail-card">
                <h3 class="detail-card-title"><i class="fas fa-calendar-alt"></i> EVENT HANDLING</h3>
                <div class="two-column-grid">
                    <div class="modal-detail-item">
                        <div class="modal-detail-label"><i class="fas fa-calendar"></i> Events Date</div>
                        <div class="modal-detail-value">${report.events || 'N/A'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label"><i class="fas fa-play-circle"></i> Start of Service</div>
                        <div class="modal-detail-value">${report.startOfService || 'N/A'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label"><i class="fas fa-stop-circle"></i> End of Service</div>
                        <div class="modal-detail-value">${report.endOfService || 'N/A'}</div>
                    </div>
                </div>
            </div>
            
            <div class="detail-card">
                <h3 class="detail-card-title"><i class="fas fa-info-circle"></i> ADDITIONAL INFORMATION</h3>
                <div class="two-column-grid">
                    <div class="modal-detail-item">
                        <div class="modal-detail-label"><i class="fas fa-calendar-check"></i> Expected Complaint Closed Date</div>
                        <div class="modal-detail-value">${report.expectedComplaintClosedDate || 'N/A'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label"><i class="fas fa-calendar-times"></i> Closed Date</div>
                        <div class="modal-detail-value">${report.closedDate || 'N/A'}</div>
                    </div>
                    <div class="modal-detail-item">
                        <div class="modal-detail-label"><i class="fas fa-user-cog"></i> Engineer Name</div>
                        <div class="modal-detail-value">${report.engineerName || 'N/A'}</div>
                    </div>
                </div>
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <button class="btn btn-warning" onclick="generatePDF('${report.id}')"><i class="fas fa-file-pdf"></i> Download PDF</button>
            </div>
        `;
        
        document.getElementById('modalContent').innerHTML = modalContent;
        document.getElementById('detailModal').style.display = 'flex';
    } catch (error) {
        console.error('Error viewing report:', error);
        showNotification('Error viewing report: ' + error.message, 'error');
    }
}

// Function to edit a report
async function editReport(id) {
    try {
        console.log("Editing report with ID:", id);
        
        if (!id) {
            showNotification('Invalid report ID', 'error');
            return;
        }
        
        // First try the search endpoint
        let response = await fetch(`${SHEETDB_API_URL}/search?id=${id}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        let data = await response.json();
        
        // If search didn't work, try getting all data and filtering
        if (!data || data.length === 0) {
            response = await fetch(SHEETDB_API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const allData = await response.json();
            data = allData.filter(item => item.id === id);
            
            if (data.length === 0) {
                showNotification('Report not found', 'error');
                return;
            }
        }
        
        const report = data[0];
        
        if (!report) {
            showNotification('Report data is invalid', 'error');
            return;
        }
        
        // Populate form fields
        document.getElementById('recordId').value = report.id || '';
        document.getElementById('date').value = report.date || '';
        document.getElementById('csrNo').value = report.csrNo || '';
        document.getElementById('customerName').value = report.customerName || '';
        document.getElementById('address').value = report.address || '';
        document.getElementById('city').value = report.city || '';
        document.getElementById('contactNo').value = report.contactNo || '';
        document.getElementById('equipmentName').value = report.equipmentName || '';
        document.getElementById('serialNo').value = report.serialNo || '';
        document.getElementById('manufacturer').value = report.manufacturer || '';
        document.getElementById('model').value = report.model || '';
        document.getElementById('customerProblem').value = report.customerProblem || '';
        document.getElementById('diagnosisFindings').value = report.diagnosisFindings || '';
        document.getElementById('rectification').value = report.rectification || '';
        document.getElementById('serviceType').value = report.serviceType || 'WARRANTY SERVICE';
        document.getElementById('events').value = report.events || '';
        document.getElementById('startOfService').value = report.startOfService || '';
        document.getElementById('endOfService').value = report.endOfService || '';
        document.getElementById('expectedComplaintClosedDate').value = report.expectedComplaintClosedDate || '';
        document.getElementById('closedDate').value = report.closedDate || '';
        document.getElementById('engineerName').value = report.engineerName || '';
        
        // Handle spares data
        const tableBody = document.getElementById('sparesTableBody');
        tableBody.innerHTML = ''; // Clear existing rows
        
        if (report.spareNames && report.spareNames !== 'N/A') {
            // Safely split the strings
            const spareNames = (report.spareNames || '').split(', ');
            const spareQuantities = (report.spareQuantities || '').split(', ');
            const spareCosts = (report.spareCosts || '').split(', ');
            
            for (let i = 0; i < spareNames.length; i++) {
                if (spareNames[i] && spareNames[i].trim() !== '') {
                    const newRow = document.createElement('tr');
                    newRow.innerHTML = `
                        <td><input type="text" name="spareName[]" placeholder="Spare part name" value="${spareNames[i] || ''}"></td>
                        <td><input type="number" name="spareQuantity[]" placeholder="Qty" min="1" value="${spareQuantities[i] || ''}" class="number-input"></td>
                        <td><input type="number" name="spareCost[]" placeholder="Cost" min="0" step="0.01" value="${spareCosts[i] || ''}" class="number-input"></td>
                        <td><button type="button" class="delete-btn" onclick="deleteSpareRow(this)"><i class="fas fa-trash"></i></button></td>
                    `;
                    tableBody.appendChild(newRow);
                }
            }
        }
        
        // Add at least one empty row if no spares
        if (tableBody.rows.length === 0) {
            addSpareRow();
        }
        
        // Switch to form tab
        openTab('formTab');
        
        showNotification('Report loaded for editing', 'success');
    } catch (error) {
        console.error('Error loading report for editing:', error);
        showNotification('Error loading report for editing: ' + error.message, 'error');
    }
}

// Function to delete report
async function deleteReport(id) {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`${SHEETDB_API_URL}/id/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.deleted === 1) {
            showNotification('Report deleted successfully', 'success');
            loadServiceReports(); // Reload the table
            updateStats(); // Update stats
        } else {
            showNotification('Error deleting report', 'error');
        }
    } catch (error) {
        console.error('Error deleting report:', error);
        showNotification('Error deleting report', 'error');
    }
}

// Function to search reports
function searchReports() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.getElementById('serviceReportsTable').getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        let found = false;
        
        for (let j = 0; j < cells.length; j++) {
            if (cells[j].textContent.toLowerCase().includes(searchTerm)) {
                found = true;
                break;
            }
        }
        
        rows[i].style.display = found ? '' : 'none';
    }
}

// Function to clear search
function clearSearch() {
    document.getElementById('searchInput').value = '';
    const rows = document.getElementById('serviceReportsTable').getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
        rows[i].style.display = '';
    }
}

// Function to close modal
function closeModal() {
    document.getElementById('detailModal').style.display = 'none';
}

// Form submission handler
document.getElementById('serviceForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Validate all required fields
    const requiredFields = document.querySelectorAll('input[required], textarea[required]');
    let valid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            valid = false;
            field.style.borderColor = 'var(--danger)';
        } else {
            field.style.borderColor = '';
        }
    });
    
    if (!valid) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Collect form data
    const formData = new FormData(this);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
        if (key.endsWith('[]')) {
            const baseKey = key.slice(0, -2);
            if (!data[baseKey]) {
                data[baseKey] = [];
            }
            // Filter out empty values
            if (value.trim() !== '') {
                data[baseKey].push(value);
            }
        } else {
            // Only add non-empty values
            if (value.trim() !== '') {
                data[key] = value;
            }
        }
    }
    
    // Convert arrays to strings for SheetDB
    if (data.spareName && data.spareName.length > 0) {
        data.spareNames = data.spareName.join(', ');
        data.spareQuantities = data.spareQuantity.join(', ');
        data.spareCosts = data.spareCost.join(', ');
        delete data.spareName;
        delete data.spareQuantity;
        delete data.spareCost;
    } else {
        data.spareNames = 'N/A';
        data.spareQuantities = 'N/A';
        data.spareCosts = 'N/A';
    }
    
    // Generate ID if not exists
    if (!data.id) {
        data.id = Date.now().toString();
    }
    
    try {
        let response;
        let method;
        
        // Check if we're updating an existing record
        if (document.getElementById('recordId').value) {
            // Update existing record
            response = await fetch(`${SHEETDB_API_URL}/id/${data.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({data: data})
            });
            method = 'updated';
        } else {
            // Create new record
            response = await fetch(SHEETDB_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({data: data})
            });
            method = 'created';
        }
        
        const result = await response.json();
        
        if ((result.created && result.created > 0) || (result.updated && result.updated > 0)) {
            showNotification(`Report ${method} successfully!`, 'success');
            resetForm();
            
            // Reload the service reports table
            loadServiceReports();
            updateStats();
            
            // Switch to data tab if we're updating
            if (method === 'updated') {
                openTab('dataTab');
            }
        } else {
            showNotification(`Error ${method} report: ${JSON.stringify(result)}`, 'error');
        }
    } catch (error) {
        console.error('Error saving data:', error);
        showNotification('Error saving data: ' + error.message, 'error');
    }
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('detailModal');
    if (event.target === modal) {
        closeModal();
    }
};

// Add validation for number fields
document.addEventListener('input', function(e) {
    if (e.target.classList.contains('number-input')) {
        if (e.target.validity.valid) {
            e.target.style.borderColor = '';
        } else {
            e.target.style.borderColor = 'var(--danger)';
        }
    }
});

// Function to generate PDF
function generatePDF(id) {
    // Open Service_pdf.html with the report ID as a parameter
    window.open(`Service_pdf.html?id=${id}`, '_blank');
}