// services/termSheetService.js

const TERM_DATA_API_URL = "/api/termdata/";
const TERM_SHEET_API_URL = "/api/termsheet/";

export const termSheetService = {
  // Get term data by opportunity ID
  async getByOpportunityId(opportunityId) {
    try {
      // Look up term data for this opportunity
      const response = await fetch(
        `${TERM_DATA_API_URL}?opportunity__ghl_id=${opportunityId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch term data: ${response.status}`);
      }

      const data = await response.json();

      // If we found term data for this opportunity
      if (data.results && data.results.length > 0) {
        // Return the first one (assuming one term sheet per opportunity)
        return {
          success: true,
          data: data.results[0],
        };
      } else {
        // No term data found for this opportunity
        return {
          success: false,
          message: "No term sheet found",
        };
      }
    } catch (error) {
      console.error("Error fetching term sheet:", error);
      return {
        success: false,
        message: "Error fetching term sheet: " + error.message,
      };
    }
  },

  // Create a new term data record
  async createTermSheet(termData) {
    try {
      console.log("Creating term sheet with data:", termData);

      const response = await fetch(TERM_DATA_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(termData),
      });

      // Check response and parse for more details
      if (!response.ok) {
        const errorText = await response.json();
        console.error(
          "Server error response:",
          response.status,
          JSON.stringify(errorText)
        );

        // Get a readable error message for UI display
        let errorMessage = "Failed to create term sheet: " + response.status;
        if (errorText && typeof errorText === "object") {
          const errors = Object.entries(errorText)
            .map(([field, message]) => `${field}: ${message}`)
            .join(", ");
          errorMessage += ` - ${errors}`;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error("Error creating term sheet:", error);
      return {
        success: false,
        message: error.message || "Error creating term sheet",
      };
    }
  },

  // Update an existing term data record
  async updateTermSheet(termSheetId, termData) {
    try {
      const response = await fetch(`${TERM_DATA_API_URL}${termSheetId}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(termData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update term sheet: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error("Error updating term sheet:", error);
      return {
        success: false,
        message: "Error updating term sheet: " + error.message,
      };
    }
  },

  // Generate PDF for term sheet
  async generatePdf(termDataId) {
    try {
      // Send request to generate PDF by creating a term sheet record
      const response = await fetch(TERM_SHEET_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          term_data: termDataId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
        message: "PDF generated successfully",
      };
    } catch (error) {
      console.error("Error generating PDF:", error);
      return {
        success: false,
        message: "Error generating PDF: " + error.message,
      };
    }
  },
};
