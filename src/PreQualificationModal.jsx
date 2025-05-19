import React, { useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import { preApprovalService } from "./services/preApprovalService";

const PreQualificationModal = ({ isOpen, onClose, data }) => {
  // Define default empty state
  const getDefaultData = (rowData) => {
    // Use rowData to pre-populate fields if provided
    return {
      date: new Date().toISOString().split("T")[0],
      llc_name: rowData?.businessName || "",
      address: rowData?.opportunityName || "",
      purchase_price: "",
      loan_type: rowData?.loan_type || "",
      loan_term: "Months", // Default prefill
      loan_amount: rowData?.monetaryValue
        ? String(rowData.monetaryValue).replace(/^\$|,/g, "")
        : "",
      rate_apr: "Floating", // Default prefill
      occupancy: "Months", // Default prefill
      applicant: rowData?.businessName || "",
      assigned_to: rowData?.assignedUser || "", // Use assigned_to instead of assigned_user
      opportunity: rowData?.ghl_id || rowData?.id || "",
    };
  };

  const [formData, setFormData] = useState(getDefaultData(null));
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formTouched, setFormTouched] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const originalDataRef = useRef({});
  const [uniqueLoanTypes, setUniqueLoanTypes] = useState([]);
  const [lastOpportunityId, setLastOpportunityId] = useState(null);
  const [dataSource, setDataSource] = useState("new"); // 'new', 'existing', or 'default'

  // Reset and load data when modal opens with a new opportunity
  useEffect(() => {
    if (isOpen && data) {
      const currentOpportunityId = data.ghl_id || data.id;

      // Force reload data every time the modal opens
      console.log("Opening modal for opportunity ID:", currentOpportunityId);
      setLastOpportunityId(currentOpportunityId);

      // Reset everything first
      setError(null);
      setSuccess(null);
      setIsLoading(true);
      setHasUnsavedChanges(false);
      setFormTouched(false);

      // Initialize with row data as fallback
      const defaultValues = getDefaultData(data);
      console.log("Created default values from row:", defaultValues);
      setFormData(defaultValues);
      originalDataRef.current = JSON.parse(JSON.stringify(defaultValues));
      setDataSource("default");

      // Fetch unique loan types if not already loaded
      if (uniqueLoanTypes.length === 0) {
        fetchLoanTypes();
      }

      // Load data for this opportunity
      loadPreQualificationData(currentOpportunityId, data);
    }
  }, [isOpen, data]);

  // Fetch unique loan types
  const fetchLoanTypes = async () => {
    try {
      // Using the same API as in the LoanDashboard
      const opportunities = await fetch(
        "https://reporting.lfglending.com/api/opportunities_v2/",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      ).then((res) => res.json());

      const loanTypes = [
        ...new Set(
          opportunities
            .map((item) => item.loan_type)
            .filter(Boolean)
            .map((type) => type.trim())
        ),
      ].sort((a, b) => a.localeCompare(b));

      setUniqueLoanTypes(loanTypes);
    } catch (error) {
      console.error("Error fetching loan types:", error);
    }
  };

  // Helper function to check if two opportunity IDs match
  const opportunityIdsMatch = (apiData, currentOpportunityId) => {
    // If opportunity is a string, do direct comparison
    if (typeof apiData.opportunity === "string") {
      return apiData.opportunity === currentOpportunityId;
    }

    // If opportunity is an object, check its ghl_id property
    if (apiData.opportunity && apiData.opportunity.ghl_id) {
      return apiData.opportunity.ghl_id === currentOpportunityId;
    }

    return false;
  };

  // Function to load pre-qualification data
  const loadPreQualificationData = async (opportunityId, rowData) => {
    if (!opportunityId) {
      setIsLoading(false);
      return;
    }

    setError(null);

    try {
      console.log("DATA RECEIVED FROM DASHBOARD:", rowData);
      console.log(
        `Loading pre-qualification data for opportunity ID: ${opportunityId}`
      );

      // Try to fetch existing pre-qualification data
      const result = await preApprovalService.getByOpportunityId(opportunityId);
      console.log("API returned result:", result);

      if (result && result.success && result.data) {
        // We found existing data for this specific opportunity - use it
        const apiData = result.data;
        console.log("FOUND EXISTING DATA:", apiData);

        // FIXED: Corrected opportunity ID matching logic using the new helper function
        // or by checking for complex opportunity structure
        const isMatch =
          // Direct string match
          (typeof apiData.opportunity === "string" &&
            apiData.opportunity === opportunityId) ||
          // Object with ghl_id match
          (apiData.opportunity && apiData.opportunity.ghl_id === opportunityId);

        if (!isMatch) {
          console.warn(
            "Received data is for a different opportunity. Using row data instead."
          );
          // Default data already set above, no need to set it again
        } else {
          // Build data object from existing data
          const loadedData = {
            id: apiData.id,
            date: apiData.date || new Date().toISOString().split("T")[0],
            llc_name: apiData.llc_name || rowData?.businessName || "",
            address: apiData.address || rowData?.opportunityName || "",
            purchase_price: apiData.purchase_price?.toString() || "",
            loan_type: apiData.loan_type || rowData?.loan_type || "",
            loan_term: apiData.loan_term || "Months",
            loan_amount:
              apiData.loan_amount?.toString() ||
              (rowData?.monetaryValue
                ? String(rowData.monetaryValue).replace(/^\$|,/g, "")
                : ""),
            rate_apr: apiData.rate_apr?.toString() || "Floating",
            occupancy: apiData.occupancy || "Months",
            applicant: apiData.applicant || rowData?.businessName || "",
            assigned_to: apiData.assigned_to || rowData?.assignedUser || "", // Use assigned_to instead of assigned_user
            opportunity: opportunityId,
            pdf_url: apiData.pdf_url,
          };

          console.log("Setting form data with existing data:", loadedData);
          setFormData(loadedData);
          originalDataRef.current = JSON.parse(JSON.stringify(loadedData));
          setDataSource("existing");
        }
      } else {
        // No data found - default data already set
        console.log("NO EXISTING DATA FOUND. Using default with row values");
      }
    } catch (error) {
      console.error("Error loading pre-qualification data:", error);
      setError("Failed to load pre-qualification data.");
      // Default data already set, nothing to do
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormTouched(true);

    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      console.log(`Field ${field} changed to:`, value);
      return updated;
    });

    setHasUnsavedChanges(true);
  };

  // Handle date selection
  const handleDateChange = (date) => {
    if (date) {
      const formattedDate = date.toISOString().split("T")[0];
      handleInputChange("date", formattedDate);
    } else {
      handleInputChange("date", "");
    }
  };

  // Handle save button click
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    console.log("Saving data:", formData);

    try {
      // Get the opportunity ID
      const opportunityId = data.ghl_id || data.id;

      // Prepare data for API
      const apiData = {
        date: formData.date || new Date().toISOString().split("T")[0],
        llc_name: formData.llc_name || "",
        address: formData.address || "",
        purchase_price: formData.purchase_price ? formData.purchase_price : "0",
        loan_type: formData.loan_type || "",
        loan_term: formData.loan_term || "Months",
        loan_amount: formData.loan_amount ? formData.loan_amount : "0",
        rate_apr: formData.rate_apr || "Floating",
        occupancy: formData.occupancy || "Months",
        applicant: formData.llc_name || "", // Default to llc_name if not set
        assigned_to: formData.assigned_to || "", // Use assigned_to instead of assigned_user
        opportunity: opportunityId,
      };

      // Basic validation - ensure we have valid data formats
      // Convert numeric strings to ensure they're valid numbers
      if (apiData.purchase_price) {
        // Remove any currency symbols, commas and normalize format
        apiData.purchase_price = apiData.purchase_price
          .toString()
          .replace(/[$,]/g, "")
          .trim();
        // Ensure it's a valid number
        if (
          apiData.purchase_price &&
          isNaN(parseFloat(apiData.purchase_price))
        ) {
          setError("Purchase Price must be a valid number");
          setIsSaving(false);
          return;
        }
      }

      if (apiData.loan_amount) {
        // Remove any currency symbols, commas and normalize format
        apiData.loan_amount = apiData.loan_amount
          .toString()
          .replace(/[$,]/g, "")
          .trim();
        // Ensure it's a valid number
        if (apiData.loan_amount && isNaN(parseFloat(apiData.loan_amount))) {
          setError("Loan Amount must be a valid number");
          setIsSaving(false);
          return;
        }
      }

      console.log("Sending data to API:", apiData);

      // Call service to save
      const result = await preApprovalService.createPreApproval(apiData);

      if (result.success) {
        console.log("Save successful, API returned:", result.data);

        // Update form with returned data
        setFormData((prev) => {
          const updatedData = {
            ...prev,
            id: result.data.id,
            pdf_url: result.data.pdf_url || null,
          };

          console.log("Updated form data after save:", updatedData);
          return updatedData;
        });

        // Update original data reference
        originalDataRef.current = JSON.parse(
          JSON.stringify({
            ...formData,
            id: result.data.id,
            pdf_url: result.data.pdf_url || null,
          })
        );

        // Reset flags
        setHasUnsavedChanges(false);
        setFormTouched(true);
        setDataSource("existing");

        setSuccess("Pre-qualification letter saved successfully!");
      } else {
        console.error("Save failed:", result.message);
        setError(result.message || "Failed to save pre-qualification letter.");
      }
    } catch (error) {
      console.error("Error saving pre-qualification:", error);

      let errorMessage = "An unexpected error occurred.";

      // More detailed error handling
      if (error.response) {
        // Server responded with an error status code
        console.error("Server error response:", error.response.data);

        if (error.response.status === 400) {
          // Bad request - try to extract validation errors
          if (error.response.data) {
            if (typeof error.response.data === "string") {
              errorMessage = `Failed to save: ${error.response.data}`;
            } else if (error.response.data.detail) {
              errorMessage = `Failed to save: ${error.response.data.detail}`;
            } else {
              // Extract field errors if they exist
              const fieldErrors = [];
              Object.keys(error.response.data).forEach((key) => {
                if (Array.isArray(error.response.data[key])) {
                  fieldErrors.push(
                    `${key}: ${error.response.data[key].join(", ")}`
                  );
                } else {
                  fieldErrors.push(`${key}: ${error.response.data[key]}`);
                }
              });

              if (fieldErrors.length > 0) {
                errorMessage = `Validation errors: ${fieldErrors.join("; ")}`;
              } else {
                errorMessage = "Failed to save: Invalid data provided.";
              }
            }
          }
        } else if (
          error.response.status === 401 ||
          error.response.status === 403
        ) {
          errorMessage = "You don't have permission to save this data.";
        } else if (error.response.status === 404) {
          errorMessage = "API endpoint not found.";
        } else if (error.response.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage =
          "No response received from server. Please check your connection.";
      } else {
        // Error setting up the request
        errorMessage = `Request error: ${error.message}`;
      }

      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle generate PDF button click
  const handleGeneratePdf = async () => {
    // Check for unsaved changes
    if (formTouched && hasUnsavedChanges) {
      setError("Please save your changes before generating a PDF");
      return;
    }

    // Check if form has been saved
    if (!formData.id) {
      setError(
        "Please save the pre-qualification letter first before generating a PDF."
      );
      return;
    }

    setIsGeneratingPdf(true);
    setError(null);
    setSuccess(null);

    try {
      // Get opportunity ID - always use the current opportunity ID from data
      const opportunityId = data.ghl_id || data.id;

      if (!opportunityId) {
        setError("Missing opportunity ID for PDF generation");
        setIsGeneratingPdf(false);
        return;
      }

      console.log("Generating PDF for opportunity ID:", opportunityId);

      // Generate PDF - use the fixed service method
      const result = await preApprovalService.generatePdf(opportunityId);

      if (result.success) {
        console.log("PDF generated successfully:", result);
        setSuccess("PDF generated successfully!");
      } else {
        console.error("PDF generation failed:", result.message);
        setError(result.message || "Failed to generate PDF.");
      }
    } catch (error) {
      console.error("PDF generation error:", error);
      setError("Failed to generate PDF. Request failed with status code 500");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!isOpen || !data) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <h2 className="text-xl text-custom">Pre-Qualification Letter</h2>
        </div>

        {/* Status messages */}
        {isLoading && (
          <div className="p-3 mx-4 mt-4 bg-blue-100 text-blue-800 rounded">
            Loading pre-qualification data...
          </div>
        )}

        {error && (
          <div className="p-3 mx-4 mt-4 bg-red-100 text-red-800 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 mx-4 mt-4 bg-green-100 text-green-800 rounded">
            {success}
          </div>
        )}

        {/* Form */}
        <div className="modal-content">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-custom mb-3 pb-1 border-b border-custom">
              Letter Information
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Date */}
              <div>
                <label className="block text-custom mb-2">Date</label>
                <DatePicker
                  selected={
                    formData.date ? new Date(formData.date) : new Date()
                  }
                  onChange={handleDateChange}
                  className="w-full bg-[var(--input-bg)] text-custom border-custom rounded-md p-2"
                  dateFormat="yyyy-MM-dd"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>

              {/* Name (LLC Name) */}
              <div>
                <label className="block text-custom mb-2">Name</label>
                <input
                  type="text"
                  value={formData.llc_name || ""}
                  onChange={(e) =>
                    handleInputChange("llc_name", e.target.value)
                  }
                  className="modal-input"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
            </div>

            {/* Added Assigned User field */}
            <div className="mb-4">
              <label className="block text-custom mb-2">Assigned User</label>
              <input
                type="text"
                value={formData.assigned_to || ""}
                onChange={(e) =>
                  handleInputChange("assigned_to", e.target.value)
                }
                className="modal-input"
                disabled={isLoading || isSaving || isGeneratingPdf}
              />
            </div>

            {/* Property Address */}
            <div className="mb-4">
              <label className="block text-custom mb-2">Property Address</label>
              <input
                type="text"
                value={formData.address || ""}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className="modal-input"
                disabled={isLoading || isSaving || isGeneratingPdf}
              />
            </div>
          </div>

          {/* Loan Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-custom mb-3 pb-1 border-b border-custom">
              Loan Details
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Purchase Price */}
              <div>
                <label className="block text-custom mb-2">Purchase Price</label>
                <input
                  type="text"
                  value={formData.purchase_price || ""}
                  onChange={(e) =>
                    handleInputChange("purchase_price", e.target.value)
                  }
                  className="modal-input"
                  placeholder="$"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>

              {/* Loan Amount */}
              <div>
                <label className="block text-custom mb-2">Loan Amount</label>
                <input
                  type="text"
                  value={formData.loan_amount || ""}
                  onChange={(e) =>
                    handleInputChange("loan_amount", e.target.value)
                  }
                  className="modal-input"
                  placeholder="$"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>

              {/* Loan Type */}
              <div>
                <label className="block text-custom mb-2">Loan Type</label>
                <select
                  value={formData.loan_type || ""}
                  onChange={(e) =>
                    handleInputChange("loan_type", e.target.value)
                  }
                  className="modal-input"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                >
                  <option value="">Select Loan Type</option>
                  {uniqueLoanTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rate / APR - Now editable */}
              <div>
                <label className="block text-custom mb-2">Rate / APR</label>
                <input
                  type="text"
                  value={formData.rate_apr || "Floating"}
                  onChange={(e) =>
                    handleInputChange("rate_apr", e.target.value)
                  }
                  className="modal-input"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>

              {/* Loan Term - Now editable */}
              <div>
                <label className="block text-custom mb-2">Loan Term</label>
                <input
                  type="text"
                  value={formData.loan_term || "Months"}
                  onChange={(e) =>
                    handleInputChange("loan_term", e.target.value)
                  }
                  className="modal-input"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>

              {/* Occupancy - Now editable */}
              <div>
                <label className="block text-custom mb-2">Occupancy</label>
                <input
                  type="text"
                  value={formData.occupancy || "Months"}
                  onChange={(e) =>
                    handleInputChange("occupancy", e.target.value)
                  }
                  className="modal-input"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            This pre-qualification is based on the information provided and is
            subject to verification of income, assets, and credit.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="modal-footer">
          <button
            onClick={onClose}
            className="btn-base"
            disabled={isLoading || isSaving || isGeneratingPdf}
          >
            Close
          </button>
          <button
            onClick={handleSave}
            className="btn-success"
            disabled={isLoading || isSaving || isGeneratingPdf}
          >
            {isSaving ? (
              <span className="flex items-center">
                <span className="w-4 h-4 mr-2 border-2 border-t-white border-b-white border-r-transparent border-l-transparent rounded-full animate-spin"></span>
                Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </button>
          <button
            onClick={handleGeneratePdf}
            className="btn-base bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
            disabled={isLoading || isSaving || isGeneratingPdf}
          >
            {isGeneratingPdf ? (
              <span className="flex items-center">
                <span className="w-4 h-4 mr-2 border-2 border-t-white border-b-white border-r-transparent border-l-transparent rounded-full animate-spin"></span>
                Generating...
              </span>
            ) : (
              "Generate PDF"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreQualificationModal;
