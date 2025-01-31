// src/services/api.js

const API_BASE_URL = "https://reporting.lfglending.com/api";

class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = "APIError";
  }
}

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(
      error.message || "An error occurred while fetching data",
      response.status
    );
  }
  return response.json();
};

export const api = {
  async getAllOpportunities() {
    try {
      const response = await fetch(`${API_BASE_URL}/opportunities_v2/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return handleResponse(response);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      throw error;
    }
  },

  async getOpportunityById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/opportunities_v2/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return handleResponse(response);
    } catch (error) {
      console.error(`Error fetching opportunity ${id}:`, error);
      throw error;
    }
  },

  async updateOpportunity(id, originalData, updatedData) {
    const updates = {};
    const fieldsToCheck = [
      "pipelineStage",
      "stage",
      "actualClosingDate",
      "dealNotes",
      "appraisalNotes",
      "insuranceNotes",
      "titleNotes",
      "followUpFriday",
    ];

    fieldsToCheck.forEach((field) => {
      if (updatedData.updates && updatedData.updates.hasOwnProperty(field)) {
        if (
          typeof updatedData.updates[field] === "boolean" ||
          updatedData.updates[field] !== originalData[field]
        ) {
          updates[field] = updatedData.updates[field];
        }
      }
    });

    if (Object.keys(updates).length === 0) {
      console.warn("⚠️ No changes detected, skipping API call.");
      return originalData;
    }

    try {
      console.log("🟢 API Request Payload:", {
        id: id,
        pipeline: originalData.pipeline,
        updates: updates,
      });

      const response = await fetch(`${API_BASE_URL}/update_custom_fields_v2/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id,
          pipeline: originalData.pipeline,
          updates: updates,
        }),
      });

      const responseData = await handleResponse(response);
      console.log("🟢 API Response:", responseData);
      return responseData;
    } catch (error) {
      console.error("🔴 Error updating opportunity:", error);
      throw error;
    }
  },

  // In api.js
  async getPipelineStages() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/unique_pipeline_names_v2/`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return handleResponse(response);
    } catch (error) {
      console.error("Error fetching pipeline stages:", error);
      throw error;
    }
  },
};
