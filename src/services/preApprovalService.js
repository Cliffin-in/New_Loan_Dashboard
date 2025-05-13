// services/preApprovalService.js - Fixed PDF Generation
import axios from "axios";

// Improved environment detection
const determineEnvironment = () => {
  // Check if window.location exists (browser environment)
  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname;

    // Check if we're on localhost or a development IP
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.includes(".local")
    ) {
      return "development";
    }

    // Check for specific production domains
    if (
      hostname.includes("kicknsaas.com") ||
      hostname.includes("amplifyapp.com")
    ) {
      return "production";
    }

    // Default to production for any other hostname
    return "production";
  }

  // Node.js environment - use NODE_ENV
  return process.env.NODE_ENV || "development";
};

// Set API base URL based on environment
const environment = determineEnvironment();
const API_BASE_URL =
  environment === "development"
    ? "/api" // Development - use relative URL for proxy
    : "https://link.kicknsaas.com/api"; // Production

console.log(`Application running in ${environment} environment`);
console.log(`Using API base URL: ${API_BASE_URL}`);

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Setup response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API request failed:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    return Promise.reject(error);
  }
);

export const preApprovalService = {
  // Get pre-approval data by opportunity ID
  getByOpportunityId: async (opportunityId) => {
    try {
      console.log("Fetching pre-approval for opportunity ID:", opportunityId);

      if (!opportunityId) {
        return {
          success: false,
          message: "Missing opportunity ID",
        };
      }

      // Ensure opportunityId is a string
      opportunityId = String(opportunityId);

      // Try to get the pre-approval directly using opportunity ID
      try {
        console.log("Fetching pre-approval by opportunity ID");
        
        // Add cache buster to prevent caching
        const timestamp = new Date().getTime();
        
        // First try direct record lookup with trailing slash
        const response = await apiClient.get(
          `/pre-approvals/${opportunityId}/?nocache=${timestamp}`
        );

        console.log("Direct API response:", response);

        // Check if there's a direct data response 
        // that contains the opportunity ID or ghl_id matching our search
        if (response.data) {
          // Check for direct API response containing a single pre-approval object
          if (
            // If opportunity is a string, check direct match
            (typeof response.data.opportunity === "string" && 
              response.data.opportunity === opportunityId) ||
            // If opportunity is an object, check ghl_id
            (response.data.opportunity && 
              response.data.opportunity.ghl_id === opportunityId)
          ) {
            console.log("Found direct pre-approval match:", response.data);
            return {
              success: true,
              data: response.data,
            };
          }
        }

        // If we didn't get a direct match, try the list approach
        console.log("No direct match found, trying list API...");
        const listResponse = await apiClient.get(
          `/pre-approvals/?nocache=${timestamp}`
        );
        
        console.log("List API response:", listResponse);
        
        // Check for results in the list endpoint
        if (
          listResponse.data &&
          listResponse.data.results &&
          listResponse.data.results.length > 0
        ) {
          // Look for an exact match in the results
          let matchingResult = null;
          
          // Try first by looking at 'opportunity' field as a string
          matchingResult = listResponse.data.results.find(
            (item) => typeof item.opportunity === "string" && 
                     item.opportunity === opportunityId
          );
          
          // If not found, try looking at opportunity.ghl_id
          if (!matchingResult) {
            matchingResult = listResponse.data.results.find(
              (item) => item.opportunity && 
                      item.opportunity.ghl_id === opportunityId
            );
          }

          if (matchingResult) {
            console.log("Found pre-approval data in list:", matchingResult);
            return {
              success: true,
              data: matchingResult,
            };
          }
        }

        console.log("No pre-approval data found for this opportunity");
        return {
          success: false,
          message: "No pre-approval data found for this opportunity.",
          notFound: true,
        };
      } catch (error) {
        console.error("Error fetching pre-approval:", error.message);
        return {
          success: false,
          message: "Failed to fetch pre-approval data.",
          error,
          notFound: true,
        };
      }
    } catch (error) {
      console.error("Error in getByOpportunityId:", error);
      return {
        success: false,
        message: "Failed to fetch pre-approval data.",
        error,
      };
    }
  },

  // Create or update a pre-approval
  createPreApproval: async (preApprovalData) => {
    try {
      // Get the opportunity ID
      let opportunityId;
      if (typeof preApprovalData.opportunity === "object") {
        opportunityId =
          preApprovalData.opportunity.ghl_id || preApprovalData.opportunity.id;
      } else {
        opportunityId = preApprovalData.opportunity;
      }

      // Validate opportunityId
      if (!opportunityId) {
        console.error("Missing opportunity ID in createPreApproval");
        return {
          success: false,
          message: "Missing opportunity ID",
        };
      }

      // Convert to string and set in data
      opportunityId = String(opportunityId);
      preApprovalData.opportunity = opportunityId;

      console.log(
        "Saving pre-approval data for opportunity ID:",
        opportunityId
      );

      // Format numeric values properly
      if (preApprovalData.purchase_price) {
        preApprovalData.purchase_price = preApprovalData.purchase_price
          .toString()
          .replace(/[$,]/g, "")
          .trim();
      }

      if (preApprovalData.loan_amount) {
        preApprovalData.loan_amount = preApprovalData.loan_amount
          .toString()
          .replace(/[$,]/g, "")
          .trim();
      }

      // Try to update directly using the opportunity ID
      try {
        console.log(
          `Updating pre-approval for opportunity ID ${opportunityId}`
        );
        const updateResponse = await apiClient.put(
          `/pre-approvals/${opportunityId}/`,
          preApprovalData
        );

        console.log("Update response:", updateResponse.data);
        return {
          success: true,
          data: updateResponse.data,
          message: "Pre-approval updated successfully.",
        };
      } catch (updateError) {
        // If update fails (likely 404 Not Found), try to create instead
        if (updateError.response && updateError.response.status === 404) {
          console.log("No existing pre-approval found, creating new one");

          try {
            const createResponse = await apiClient.post(
              `/pre-approvals/`,
              preApprovalData
            );

            console.log("Create response:", createResponse.data);
            return {
              success: true,
              data: createResponse.data,
              message: "Pre-approval created successfully.",
            };
          } catch (createError) {
            // If creation fails too, handle the error
            console.error("Error creating pre-approval:", createError.message);

            let errorMessage = "Failed to create pre-approval.";

            if (createError.response && createError.response.data) {
              if (typeof createError.response.data === "string") {
                errorMessage = createError.response.data;
              } else if (createError.response.data.detail) {
                errorMessage = createError.response.data.detail;
              } else if (createError.response.data.opportunity) {
                errorMessage = createError.response.data.opportunity;
              }
            }

            return {
              success: false,
              message: errorMessage,
              error: createError,
            };
          }
        } else {
          // Some other error occurred during update
          console.error("Error updating pre-approval:", updateError.message);

          let errorMessage = "Failed to update pre-approval.";

          if (updateError.response && updateError.response.data) {
            if (typeof updateError.response.data === "string") {
              errorMessage = updateError.response.data;
            } else if (updateError.response.data.detail) {
              errorMessage = updateError.response.data.detail;
            } else if (updateError.response.data.opportunity) {
              errorMessage = updateError.response.data.opportunity;
            }
          }

          return {
            success: false,
            message: errorMessage,
            error: updateError,
          };
        }
      }
    } catch (error) {
      // General error handling
      console.error("Error in createPreApproval:", error.message);
      return {
        success: false,
        message: `Failed to save pre-approval data: ${error.message}`,
        error,
      };
    }
  },

  // Generate PDF for a pre-approval - FIXED TO WORK WITH BACKEND
  generatePdf: async (opportunityId) => {
    try {
      console.log("Generating PDF for opportunity ID:", opportunityId);

      // Validate opportunityId
      if (!opportunityId) {
        console.error("Missing opportunity ID in generatePdf");
        return {
          success: false,
          message: "Missing opportunity ID",
        };
      }

      // Ensure opportunityId is a string
      opportunityId = String(opportunityId);

      // FIXED: Send a blank POST request with NO URL parameters to the PDF generation endpoint
      // The backend is expecting the ID in the URL path, not as a query parameter
      const response = await apiClient.post(
        `/pre-approvals/${opportunityId}/generate_pdf/`,
        {} // Empty request body
      );

      console.log("PDF generation response:", response.data);

      if (response.data && response.data.pdf_url) {
        // If the API returns a PDF URL, open it in a new tab
        window.open(response.data.pdf_url, "_blank");
      }

      return {
        success: true,
        data: response.data,
        message: "PDF generated successfully.",
      };
    } catch (error) {
      console.error("Error generating PDF:", error.message);
      console.error(
        "Error details:",
        error.response?.data || "No response data"
      );
      return {
        success: false,
        message: `Failed to generate PDF: ${error.message}`,
        error,
      };
    }
  },
};

export default preApprovalService;