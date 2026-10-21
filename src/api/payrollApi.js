import axiosClient, { API_BASE_URL } from './axiosClient';

export const payrollApi = {
  // Generation & Listing
  generatePayroll: (data) => axiosClient.post('/payroll/generate', data),
  getPayrollRecords: async (params) => {
    try {
      return await axiosClient.get('/payroll', { params });
    } catch (err) {
      // If backend server process has not been restarted since mounting /payroll routes, fallback gracefully
      if (
        err.response?.status === 404 ||
        err.message?.includes('Cannot find GET /api/v1/payroll') ||
        err.response?.data?.message?.includes('Cannot find GET /api/v1/payroll')
      ) {
        console.warn('Backend server process needs restart to load /payroll route into memory.');
        return {
          success: true,
          data: [],
          needsServerRestart: true,
          pagination: {
            total: 0,
            page: params?.page || 1,
            limit: params?.limit || 20,
            totalPages: 1,
          },
        };
      }
      throw err;
    }
  },
  getPayrollById: (id) => axiosClient.get(`/payroll/${id}`),

  // State Machine Transitions & Workflows
  transitionStatus: (id, data) => axiosClient.post(`/payroll/${id}/transition`, data),
  reviewPayroll: (id, data) => axiosClient.post(`/payroll/${id}/review`, data),
  approvePayroll: (id, data) => axiosClient.post(`/payroll/${id}/approve`, data),
  recordPayment: (id, data) => axiosClient.post(`/payroll/${id}/pay`, data),
  reversePayroll: (id, data) => axiosClient.post(`/payroll/${id}/reverse`, data),
  addAdjustment: (id, data) => axiosClient.post(`/payroll/${id}/adjust`, data),

  // Backward compatible finalization
  finalizePayroll: (id, data) => axiosClient.patch(`/payroll/${id}/finalize`, data),
  finalizeBatch: (data) => axiosClient.post('/payroll/finalize-batch', data),

  // Self-Service & Payslips
  getMyPayslips: (params) => axiosClient.get('/payroll/my-payslips', { params }),
  getPayslip: (id) => axiosClient.get(`/payroll/${id}/payslip`),

  // Direct Binary PDF Payslip Downloader
  downloadPayslipPdf: async (id, customFilename) => {
    const token = localStorage.getItem('speeddex_access_token');
    const url = `${API_BASE_URL}/payroll/${id}/payslip/pdf`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Failed to download payslip PDF');
    }

    const blob = await res.blob();
    const disposition = res.headers.get('content-disposition');
    let filename = customFilename || `payslip_${id}.pdf`;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  // On-Demand Employee Salary Slip Generator & Downloader
  getEmployeeSalarySlip: (employeeId, params) =>
    axiosClient.get(`/payroll/employee/${employeeId}/slip`, { params }),

  downloadEmployeePayslipPdf: async (employeeId, params, customFilename) => {
    const token = localStorage.getItem('speeddex_access_token');
    const query = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/payroll/employee/${employeeId}/slip/pdf${query ? `?${query}` : ''}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || 'Failed to download payslip PDF');
    }

    const blob = await res.blob();
    const disposition = res.headers.get('content-disposition');
    let filename = customFilename || `payslip_${employeeId}.pdf`;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};
