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

      // Only reset and reload if it's a different opportunity
      if (currentOpportunityId !== lastOpportunityId) {
        console.log(
          "Opening modal for new opportunity ID:",
          currentOpportunityId
        );
        setLastOpportunityId(currentOpportunityId);

        // Reset everything
        const defaultValues = getDefaultData(data); // Pass the current row data to initialize defaults
        setFormData(defaultValues);
        setError(null);
        setSuccess(null);
        setHasUnsavedChanges(false);
        setFormTouched(false);
        originalDataRef.current = JSON.parse(JSON.stringify(defaultValues));
        setDataSource("default");

        // Fetch unique loan types if not already loaded
        if (uniqueLoanTypes.length === 0) {
          fetchLoanTypes();
        }

        // Load data for this opportunity
        loadPreQualificationData(currentOpportunityId, data);
      }
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

  // Function to load pre-qualification data
  const loadPreQualificationData = async (opportunityId, rowData) => {
    if (!opportunityId) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log("DATA RECEIVED FROM DASHBOARD:", rowData);
      console.log(
        `Loading pre-qualification data for opportunity ID: ${opportunityId}`
      );

      // Try to fetch existing pre-qualification data
      const result = await preApprovalService.getByOpportunityId(opportunityId);

      if (result && result.success && result.data) {
        // We found existing data for this specific opportunity - use it
        const apiData = result.data;
        console.log("FOUND EXISTING DATA:", apiData);

        // Double-check this data is for the correct opportunity
        if (String(apiData.opportunity) !== String(opportunityId)) {
          console.warn(
            "Received data is for a different opportunity. Using row data instead."
          );
          // Use default data from the current row
          const defaultValues = getDefaultData(rowData);
          setFormData(defaultValues);
          originalDataRef.current = JSON.parse(JSON.stringify(defaultValues));
          setDataSource("default");
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
            opportunity: apiData.opportunity || opportunityId,
            pdf_url: apiData.pdf_url,
          };

          console.log("Setting form data with existing data:", loadedData);
          setFormData(loadedData);
          originalDataRef.current = JSON.parse(JSON.stringify(loadedData));
          setDataSource("existing");
        }
      } else {
        // No data found - create new default data with row values
        console.log("NO EXISTING DATA FOUND. Creating default with row values");

        // Create a fresh default object based on the current row
        const newDefaultData = getDefaultData(rowData);

        console.log(
          "Setting form data with new default values:",
          newDefaultData
        );
        setFormData(newDefaultData);
        originalDataRef.current = JSON.parse(JSON.stringify(newDefaultData));
        setDataSource("new");
      }
    } catch (error) {
      console.error("Error loading pre-qualification data:", error);
      setError("Failed to load pre-qualification data.");

      // Even on error, create new default data
      const errorDefaultData = getDefaultData(rowData);

      console.log("Setting form data after error:", errorDefaultData);
      setFormData(errorDefaultData);
      originalDataRef.current = JSON.parse(JSON.stringify(errorDefaultData));
      setDataSource("error");
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
      console.log("Updated form data:", updated);
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
        purchase_price: formData.purchase_price || "0",
        loan_type: formData.loan_type || "",
        loan_term: formData.loan_term || "Months",
        loan_amount: formData.loan_amount || "0",
        rate_apr: formData.rate_apr || "Floating",
        occupancy: formData.occupancy || "Months",
        applicant: formData.llc_name || "", // Default to llc_name if not set
        opportunity: opportunityId,
      };

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
      setError("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle generate PDF button click
  const handleGeneratePdf = async () => {
    // Check for unsaved changes
    if (formTouched && hasUnsavedChanges) {
      setError("UNSAVED CHANGES - PLEASE SAVE");
      return;
    }

    // Check if form has been saved
    if (!formTouched || !formData.id) {
      setError(
        "Please save the pre-qualification letter first before generating a PDF."
      );
      return;
    }

    setIsGeneratingPdf(true);
    setError(null);
    setSuccess(null);

    try {
      // Get opportunity ID
      const opportunityId =
        typeof formData.opportunity === "string"
          ? formData.opportunity
          : formData.opportunity?.id ||
            formData.opportunity?.ghl_id ||
            data.ghl_id ||
            data.id;

      console.log("Generating PDF for opportunity ID:", opportunityId);

      // Generate PDF
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
      setError(
        `Error generating PDF: ${
          error.response?.data?.message || error.message
        }`
      );
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
