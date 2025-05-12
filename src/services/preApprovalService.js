// services/preApprovalService.js
import axios from "axios";

// Base API URL
const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "/api" // Use relative URL for development proxy
    : "https://link.kicknsaas.com/api";

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

      // First try direct approach with trailing slash
      try {
        const directResponse = await apiClient.get(
          `/pre-approvals/${opportunityId}/`
        );

        if (directResponse.data) {
          console.log("Found pre-approval data:", directResponse.data);

          // Verify this is actually for the correct opportunity
          if (
            directResponse.data.opportunity &&
            String(directResponse.data.opportunity) === String(opportunityId)
          ) {
            return {
              success: true,
              data: directResponse.data,
            };
          } else {
            console.warn(
              "Data found but does not match the requested opportunity ID"
            );
            return {
              success: false,
              message:
                "No matching pre-approval data found for this opportunity.",
              notFound: true,
            };
          }
        }
      } catch (directError) {
        // If it's a 404 error, try the filter approach
        if (directError.response && directError.response.status === 404) {
          console.log("No pre-approval found with direct approach (404)");

          try {
            console.log("Trying filter approach");
            const queryResponse = await apiClient.get(
              `/pre-approvals/?opportunity=${opportunityId}`
            );

            if (
              queryResponse.data &&
              queryResponse.data.results &&
              queryResponse.data.results.length > 0
            ) {
              // Verify the returned data is actually for the requested opportunity
              const matchingResult = queryResponse.data.results.find(
                (item) => String(item.opportunity) === String(opportunityId)
              );

              if (matchingResult) {
                console.log(
                  "Found pre-approval data via filter:",
                  matchingResult
                );
                return {
                  success: true,
                  data: matchingResult,
                };
              } else {
                console.log(
                  "Filter returned results but none match the requested opportunity ID"
                );
                return {
                  success: false,
                  message: "No pre-approval data found for this opportunity.",
                  notFound: true,
                };
              }
            } else {
              console.log("No pre-approval data found for this opportunity");
              return {
                success: false,
                message: "No pre-approval data found for this opportunity.",
                notFound: true,
              };
            }
          } catch (queryError) {
            console.error("Filter query error:", queryError.message);
            return {
              success: false,
              message: "No pre-approval data found and filter query failed.",
              notFound: true,
            };
          }
        } else {
          console.error("Direct fetch error (not 404):", directError.message);
          return {
            success: false,
            message:
              "Failed to fetch pre-approval data: " + directError.message,
            error: directError,
          };
        }
      }
    } catch (error) {
      console.error("Error in getByOpportunityId:", error);
      return {
        success: false,
        message: "Failed to fetch pre-approval data.",
        error,
      };
    }

    // Default return if execution reaches here
    return {
      success: false,
      message: "No pre-approval data found for this opportunity.",
      notFound: true,
    };
  },

  // Create or update a pre-approval
  createPreApproval: async (preApprovalData) => {
    try {
      // Ensure opportunity ID is a string
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

      opportunityId = String(opportunityId);
      preApprovalData.opportunity = opportunityId;

      console.log("Saving pre-approval data to API:", preApprovalData);

      // First check if a pre-approval already exists
      let existingData;
      try {
        const existingResponse = await apiClient.get(
          `/pre-approvals/${opportunityId}/`
        );

        // Verify the data is actually for this opportunity
        if (
          existingResponse.data &&
          String(existingResponse.data.opportunity) === String(opportunityId)
        ) {
          existingData = {
            success: true,
            data: existingResponse.data,
          };
          console.log("Found existing pre-approval:", existingData.data);
        } else {
          console.log(
            "Found data but it doesn't match the requested opportunity"
          );
          existingData = { success: false };
        }
      } catch (checkError) {
        console.log(
          "No existing pre-approval found or error checking:",
          checkError.message
        );
        existingData = { success: false };
      }

      // If pre-approval exists, update it with PUT
      if (existingData.success && existingData.data) {
        console.log(
          "Updating existing pre-approval with opportunity ID:",
          opportunityId
        );

        // Ensure the ID fields match
        preApprovalData.id = existingData.data.id;

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
      }
      // If it doesn't exist, create it with POST
      else {
        console.log(
          "Creating new pre-approval with opportunity ID:",
          opportunityId
        );
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
      }
    } catch (error) {
      console.error("Error saving pre-approval data:", error.message);
      console.error(
        "Error details:",
        error.response?.data || "No response data"
      );
      console.error("Request that failed:", error.config);
      return {
        success: false,
        message: `Failed to save pre-approval data: ${error.message}`,
        error,
      };
    }
  },

  // Generate PDF for a pre-approval
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

      // Send a blank POST request to the PDF generation endpoint
      const response = await apiClient.post(
        `/pre-approvals/${opportunityId}/generate_pdf/`
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
