// services/termSheetService.js
import axios from 'axios';

// Base API URL - will be used for all requests
// In production, this should point directly to the API
// In development, you may need to use a proxy
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? '/api' // Use relative URL that will be handled by your proxy in development
  : 'https://link.kicknsaas.com/api';

// Create an instance of axios with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Setup response interceptor for better error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API request failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return Promise.reject(error);
  }
);

export const termSheetService = {
  // Get term sheet data by opportunity ID (using GHL ID)
  getByOpportunityId: async (opportunityId) => {
    try {
      console.log("Fetching term sheet for opportunity ID:", opportunityId);
      
      // Direct request using the exact URL format with trailing slash
      try {
        const directResponse = await apiClient.get(`/termdata/${opportunityId}/`);
        
        if (directResponse.data) {
          console.log("Found term sheet data:", directResponse.data);
          return {
            success: true,
            data: directResponse.data,
          };
        }
      } catch (directError) {
        // If it's a 404 error, it means no term sheet exists - that's expected
        if (directError.response && directError.response.status === 404) {
          console.log("No term sheet found with direct approach (404)");
          
          // Try the filter approach
          try {
            console.log("Trying alternate approach with filter query");
            const queryResponse = await apiClient.get(`/termdata/?opportunity=${opportunityId}`);
            
            // Check if we have data for this opportunity
            if (queryResponse.data.results && queryResponse.data.results.length > 0) {
              console.log("Found term sheet data via filter:", queryResponse.data.results[0]);
              return {
                success: true,
                data: queryResponse.data.results[0], // Return the first matching term sheet
              };
            } else {
              // No term sheet data found via filter either
              console.log("No term sheet data found for this opportunity");
              return {
                success: false,
                message: 'No term sheet data found for this opportunity.',
                notFound: true // Add flag to indicate data not found (vs. error)
              };
            }
          } catch (queryError) {
            // Filter approach also failed
            console.error("Filter query error:", queryError.message);
            return {
              success: false,
              message: 'No term sheet data found and filter query failed.',
              notFound: true
            };
          }
        } else {
          // Not a 404 error - might be network, server error, etc.
          console.error("Direct fetch error (not 404):", directError.message);
          return {
            success: false,
            message: 'Failed to fetch term sheet data: ' + directError.message,
            error: directError
          };
        }
      }
    } catch (error) {
      console.error("Error in getByOpportunityId:", error);
      return {
        success: false,
        message: 'Failed to fetch term sheet data.',
        error,
      };
    }
    
    // If we reach here somehow, no data was found
    return {
      success: false,
      message: 'No term sheet data found for this opportunity.',
      notFound: true
    };
  },

  // Create a new term sheet
  createTermSheet: async (termSheetData) => {
    try {
      // Extract the GHL ID - make sure we're getting it correctly
      let opportunityId;
      if (typeof termSheetData.opportunity === 'object') {
        opportunityId = termSheetData.opportunity.ghl_id || termSheetData.opportunity.id;
        console.log("Extracted GHL ID from object:", opportunityId);
      } else {
        opportunityId = termSheetData.opportunity;
        console.log("Using provided opportunity ID:", opportunityId);
      }
      
      // Ensure opportunityId is a string
      opportunityId = String(opportunityId);
      
      // Use opportunityId directly in the API paths
      termSheetData.opportunity = opportunityId;
      
      console.log("Saving data to API:", termSheetData);
      
      // First check if a term sheet already exists for this opportunity
      let existingData;
      try {
        // Try to get existing term sheet data directly with the specified URL format (with trailing slash)
        const existingResponse = await apiClient.get(`/termdata/${opportunityId}/`);
        existingData = {
          success: true,
          data: existingResponse.data
        };
      } catch (checkError) {
        console.log("No existing term sheet found or error checking:", checkError.message);
        existingData = { success: false };
      }
      
      // If it exists, update it with PUT
      if (existingData.success && existingData.data) {
        console.log("Updating existing term sheet with opportunity ID:", opportunityId);
        
        // Use the exact URL format you specified for PUT requests WITH trailing slash
        const updateResponse = await apiClient.put(
          `/termdata/${opportunityId}/`, 
          termSheetData
        );
        
        console.log("Update response:", updateResponse.data);
        return {
          success: true,
          data: updateResponse.data,
          message: 'Term sheet updated successfully.',
        };
      } 
      
      // If it doesn't exist, create it with POST
      else {
        console.log("Creating new term sheet");
        const createResponse = await apiClient.post(`/termdata/`, termSheetData);
        
        console.log("Create response:", createResponse.data);
        return {
          success: true,
          data: createResponse.data,
          message: 'Term sheet created successfully.',
        };
      }
    } catch (error) {
      console.error("Error saving term sheet data:", error.message);
      console.error("Error details:", error.response?.data || "No response data");
      console.error("Request that failed:", error.config);
      return {
        success: false,
        message: `Failed to save term sheet data: ${error.message}`,
        error,
      };
    }
  },

  // Generate PDF from term sheet data - uses opportunity ID directly
  generatePdf: async (opportunityId) => {
    try {
      console.log("Generating PDF for opportunity ID:", opportunityId);
      
      // Ensure opportunityId is a string
      opportunityId = String(opportunityId);
      
      // Send a blank POST request to the PDF generation endpoint
      const response = await apiClient.post(`/termdata/${opportunityId}/generate_pdf/`);
      
      console.log("PDF generation response:", response.data);
      
      if (response.data && response.data.pdf_url) {
        // If the API returns a PDF URL, open it in a new tab
        window.open(response.data.pdf_url, '_blank');
      }
      
      return {
        success: true,
        data: response.data,
        message: 'PDF generated successfully.',
      };
    } catch (error) {
      console.error("Error generating PDF:", error.message);
      console.error("Error details:", error.response?.data || "No response data");
      return {
        success: false,
        message: `Failed to generate PDF: ${error.message}`,
        error,
      };
    }
  }
};

export default termSheetService;