// services/termSheetService.js
import axios from 'axios';

const API_BASE_URL = 'https://link.kicknsaas.com/api';

export const termSheetService = {
  // Get term sheet data by opportunity ID (using GHL ID)
  getByOpportunityId: async (opportunityId) => {
    try {
      console.log("Fetching term sheet for opportunity ID:", opportunityId);
      
      // Direct request using the exact URL format with trailing slash
      try {
        const directResponse = await axios.get(`${API_BASE_URL}/termdata/${opportunityId}/`);
        
        if (directResponse.data) {
          console.log("Found term sheet data:", directResponse.data);
          return {
            success: true,
            data: directResponse.data,
          };
        }
      } catch (directError) {
        console.error("Direct fetch error:", directError.message);
        
        // Fallback to filter approach if direct approach fails
        try {
          console.log("Trying alternate approach with filter query");
          const queryResponse = await axios.get(`${API_BASE_URL}/termdata/?opportunity=${opportunityId}`);
          
          // Check if we have data for this opportunity
          if (queryResponse.data.results && queryResponse.data.results.length > 0) {
            console.log("Found term sheet data via filter:", queryResponse.data.results[0]);
            return {
              success: true,
              data: queryResponse.data.results[0], // Return the first matching term sheet
            };
          } else {
            console.log("No term sheet data found for this opportunity");
            return {
              success: false,
              message: 'No term sheet data found for this opportunity.',
            };
          }
        } catch (queryError) {
          console.error("Filter query error:", queryError.message);
          console.error("Full error details:", queryError.response || queryError);
          return {
            success: false,
            message: 'Failed to fetch term sheet data.',
            error: queryError,
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
    
    // If we reach here, no data was found
    return {
      success: false,
      message: 'No term sheet data found for this opportunity.',
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
      
      // Use opportunityId directly in the API paths
      termSheetData.opportunity = opportunityId;
      
      console.log("Saving data to API:", termSheetData);
      console.log("API URL for checking existing:", `${API_BASE_URL}/termdata/${opportunityId}/`);
      
      // First check if a term sheet already exists for this opportunity
      let existingData;
      try {
        // Try to get existing term sheet data directly with the specified URL format (with trailing slash)
        const existingResponse = await axios.get(`${API_BASE_URL}/termdata/${opportunityId}/`);
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
        const updateResponse = await axios.put(
          `${API_BASE_URL}/termdata/${opportunityId}/`, 
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
        const createResponse = await axios.post(`${API_BASE_URL}/termdata/`, termSheetData);
        
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
      
      // Send a blank POST request to the PDF generation endpoint
      const response = await axios.post(`${API_BASE_URL}/termdata/${opportunityId}/generate_pdf/`);
      
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