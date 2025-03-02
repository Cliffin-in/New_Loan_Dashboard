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
      "followers",
    ];

    fieldsToCheck.forEach((field) => {
      if (updatedData.updates && updatedData.updates.hasOwnProperty(field)) {
        // Special handling for the followers array - compare arrays properly
        if (field === "followers") {
          // If arrays are different (by comparing stringified versions)
          // or if one is present and one isn't, include the field
          const originalFollowers = JSON.stringify(originalData.followers || []);
          const updatedFollowers = JSON.stringify(updatedData.updates.followers || []);
          
          if (originalFollowers !== updatedFollowers) {
            updates[field] = updatedData.updates[field];
          }
        } else if (
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
  
  // New method to get all followers from opportunities
  async getAllFollowers() {
    try {
      const opportunities = await this.getAllOpportunities();
      
      // Extract unique followers from all opportunities
      const allFollowers = new Set();
      opportunities.forEach(opportunity => {
        if (opportunity.followers && Array.isArray(opportunity.followers)) {
          opportunity.followers.forEach(follower => {
            if (follower && follower.trim()) {
              allFollowers.add(follower.trim());
            }
          });
        }
      });
      
      // Convert set to sorted array
      return Array.from(allFollowers).sort();
    } catch (error) {
      console.error("Error fetching all followers:", error);
      throw error;
    }
  }
};