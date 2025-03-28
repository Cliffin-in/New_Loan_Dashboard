import React, { useState, useEffect, useRef } from "react";
import { termSheetService } from "./services/termSheetService";
import { pdfService } from "./services/pdfService";
import axios from "axios";

const TermSheetModal = ({ isOpen, onClose, data }) => {
  const [termSheetData, setTermSheetData] = useState({
    // Deal Info
    borrower: "",
    propertyAddress: "",
    property_address: "", // Keep both formats for compatibility

    // Deal Structure
    loanPurpose: "",
    loanAmount: "",
    loanToValue: "",
    asIsValue: "",
    rehabCost: "",
    afterRepairedValue: "",

    // Loan Terms
    loanType: "",
    loan_type: "", // Keep both formats for compatibility
    interestRate: "",
    monthlyPayment: "",
    prePaymentPenalty: "",

    // Loan Fees
    originationCost: "",
    lenderFee: "",
    processingFee: "",
    cashToBorrower: "",
    additionalLiquidity: "N/A",

    // Property Info
    propertyType: "",
    ficoScore: "",
    fairMarketRent: "",
    propertyDesignation: "",
    bankruptcyIn3Yrs: "",
    foreclosuresIn3Yrs: "",
    feloniesOrCrimes: "",

    // Annual Costs
    annualTaxes: "",
    annualInsurance: "",
    annualFloodInsurance: "",
    annualHoaDues: "",
    currentDscr: "",
  });

  // Reference to store original data for comparison
  const originalDataRef = useRef({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load term sheet data when modal opens
  useEffect(() => {
    if (isOpen && data) {
      // Clear any previous error or success messages
      setError(null);
      setSuccess(null);
      // Initially set to false - we'll detect if there are actual changes later
      setHasUnsavedChanges(false);
      loadTermSheetData();
    }
  }, [isOpen, data?.id]);

  // Function to load term sheet data
  const loadTermSheetData = async () => {
    if (!data || !data.id) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use the GHL ID to fetch term sheet data
      const ghl_id = data.ghl_id || data.id;
      const result = await termSheetService.getByOpportunityId(ghl_id);

      if (result.success) {
        // We found term data, load it and convert snake_case to camelCase
        const apiData = result.data;
        const loadedData = {
          // Map the API response data to our form fields
          borrower: apiData.borrower || "",
          propertyAddress: apiData.property_address || "",
          property_address: apiData.property_address || "", // Keep both formats for compatibility

          loanPurpose: apiData.loan_purpose || "",
          loanAmount: apiData.loan_amount || "",
          loanToValue: apiData.loan_to_value || "",
          asIsValue: apiData.as_is_value || "",
          rehabCost: apiData.rehab_cost || "",
          afterRepairedValue: apiData.after_repaired_value || "",

          loanType: apiData.loan_type || "",
          loan_type: apiData.loan_type || "", // Keep both formats for compatibility
          interestRate: apiData.interest_rate || "",
          monthlyPayment: apiData.monthly_payment || "",
          prePaymentPenalty: apiData.prepayment_penalty || "",

          originationCost: apiData.origination_cost || "",
          lenderFee: apiData.lender_fee || "",
          processingFee: apiData.processing_fee || "",
          cashToBorrower: apiData.cash_to_from_borrower || "",
          additionalLiquidity: apiData.additional_liquidity || "N/A",

          propertyType: apiData.property_type || "",
          ficoScore: apiData.fico_score || "",
          fairMarketRent: apiData.fair_market_rent || "",
          propertyDesignation: apiData.property_designation || "",
          bankruptcyIn3Yrs: apiData.bankruptcy_last_3yrs || "",
          foreclosuresIn3Yrs: apiData.foreclosures_last_3yrs || "",
          feloniesOrCrimes: apiData.felonies_crimes || "",

          annualTaxes: apiData.annual_taxes || "",
          annualInsurance: apiData.annual_insurance || "",
          annualFloodInsurance: apiData.annual_flood_insurance || "",
          annualHoaDues: apiData.annual_hoa_dues || "",
          currentDscr: apiData.current_dscr || "",

          // Essential to keep the opportunity ID reference
          opportunity: apiData.opportunity || ghl_id,

          // Store the ID for PDF generation
          id: apiData.id,

          // If there's term sheet data with a PDF file, store the URL
          term_sheet: apiData.term_sheet,
        };
        
        setTermSheetData(loadedData);
        // Store original data for comparison to detect changes
        originalDataRef.current = JSON.parse(JSON.stringify(loadedData));
      } else {
        // No term data found, initialize with data from the opportunity
        const initialData = {
          // Reset all fields to initial values
          borrower: data.name || "",
          propertyAddress: data.opportunityName || "",
          property_address: data.opportunityName || "", // Keep both formats for compatibility

          loanType: data.loan_type || "",
          loan_type: data.loan_type || "", // Keep both formats for compatibility

          loanAmount: data.monetaryValue
            ? data.monetaryValue.toString().replace(/^\$/, "")
            : "",

          // Essential to keep the opportunity ID reference
          opportunity: ghl_id,

          // Set all other fields to empty values
          loanPurpose: "",
          loanToValue: "",
          asIsValue: "",
          rehabCost: "",
          afterRepairedValue: "",
          interestRate: "",
          monthlyPayment: "",
          prePaymentPenalty: "",
          originationCost: "",
          lenderFee: "",
          processingFee: "",
          cashToBorrower: "",
          additionalLiquidity: "N/A",
          propertyType: "",
          ficoScore: "",
          fairMarketRent: "",
          propertyDesignation: "",
          bankruptcyIn3Yrs: "",
          foreclosuresIn3Yrs: "",
          feloniesOrCrimes: "",
          annualTaxes: "",
          annualInsurance: "",
          annualFloodInsurance: "",
          annualHoaDues: "",
          currentDscr: "",
        };
        
        setTermSheetData(initialData);
        // Store original data for comparison to detect changes
        originalDataRef.current = JSON.parse(JSON.stringify(initialData));
      }
    } catch (error) {
      setError("Failed to load term sheet data.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Track if any changes have been made to the form
  const [formTouched, setFormTouched] = useState(false);

  // Update original data reference after loading
  useEffect(() => {
    if (!isLoading && termSheetData) {
      originalDataRef.current = JSON.parse(JSON.stringify(termSheetData));
    }
  }, [isLoading, termSheetData]);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormTouched(true);
    
    setTermSheetData({
      ...termSheetData,
      [field]: value,
    });
    
    // Compare with original data to detect actual changes
    const updatedData = {
      ...termSheetData,
      [field]: value,
    };
    
    const hasChanges = JSON.stringify(updatedData) !== JSON.stringify(originalDataRef.current);
    setHasUnsavedChanges(hasChanges);
  };

  // Handle save button click
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Get the GHL ID from the data object
      const ghl_id = data.ghl_id || data.id;

      // Convert camelCase to snake_case for API and handle null values
      const convertedData = {
        borrower: termSheetData.borrower || "",
        property_address:
          termSheetData.property_address || termSheetData.propertyAddress || "",
        loan_purpose: termSheetData.loanPurpose || "",
        // Convert null or empty string to "0" for numeric fields
        as_is_value: termSheetData.asIsValue || "0",
        loan_amount: termSheetData.loanAmount || "0",
        rehab_cost: termSheetData.rehabCost || "0",
        loan_to_value: termSheetData.loanToValue || "0",
        after_repaired_value: termSheetData.afterRepairedValue || "0",
        loan_type: termSheetData.loanType || termSheetData.loan_type || "",
        interest_rate: termSheetData.interestRate || "0",
        monthly_payment: termSheetData.monthlyPayment || "0",
        prepayment_penalty: termSheetData.prePaymentPenalty || "",
        origination_cost: termSheetData.originationCost || "0",
        cash_to_from_borrower: termSheetData.cashToBorrower || "0",
        lender_fee: termSheetData.lenderFee || "0",
        additional_liquidity: termSheetData.additionalLiquidity || "0",
        processing_fee: termSheetData.processingFee || "0",
        property_type: termSheetData.propertyType || "",
        annual_taxes: termSheetData.annualTaxes || "0",
        fico_score: termSheetData.ficoScore || "0",
        annual_insurance: termSheetData.annualInsurance || "0",
        fair_market_rent: termSheetData.fairMarketRent || "0",
        annual_flood_insurance: termSheetData.annualFloodInsurance || "0",
        property_designation: termSheetData.propertyDesignation || "",
        annual_hoa_dues: termSheetData.annualHoaDues || "0",
        bankruptcy_last_3yrs: termSheetData.bankruptcyIn3Yrs || "",
        current_dscr: termSheetData.currentDscr || "0",
        foreclosures_last_3yrs: termSheetData.foreclosuresIn3Yrs || "",
        felonies_crimes: termSheetData.feloniesOrCrimes || "",
        opportunity: ghl_id,
      };

      // Use the service to save the term sheet
      const result = await termSheetService.createTermSheet(convertedData);

      if (result.success) {
        // Save was successful - update the state with the new data including ID
        setTermSheetData((prevData) => ({
          ...prevData,
          id: result.data.id,
          term_sheet: result.data.term_sheet || null,
        }));

        // Update original data reference to match current state
        originalDataRef.current = JSON.parse(JSON.stringify({
          ...termSheetData,
          id: result.data.id,
          term_sheet: result.data.term_sheet || null,
        }));
        
        // Mark as saved - reset both flags
        setHasUnsavedChanges(false);
        setFormTouched(true); // Form has been touched, but no unsaved changes
        
        setSuccess("Term sheet saved successfully!");
      } else {
        setError(result.message || "Failed to save term sheet.");
      }
    } catch (error) {
      setError("An unexpected error occurred.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle generate PDF button click
  const handleGeneratePdf = async () => {
    // Check if form has been touched but not saved
    if (formTouched && hasUnsavedChanges) {
      setError("UNSAVED CHANGES - PLEASE SAVE");
      return;
    }
    
    // If form hasn't been touched at all
    if (!formTouched) {
      setError("NO CHANGES FOUND ON DATA");
      return;
    }
    
    // Get the opportunity ID - ensure it's a string, not an object
    let opportunityId = "";
    
    // Try to get opportunity ID from termSheetData first
    if (typeof termSheetData.opportunity === 'string') {
      opportunityId = termSheetData.opportunity;
    } 
    // If it's an object, try to get the id from it
    else if (typeof termSheetData.opportunity === 'object' && termSheetData.opportunity) {
      opportunityId = termSheetData.opportunity.id || termSheetData.opportunity.ghl_id || "";
    }
    // Fallback to data object if needed
    else {
      opportunityId = data.ghl_id || data.id || "";
    }
    
    // Ensure opportunityId is actually a string value
    if (!opportunityId || typeof opportunityId !== 'string') {
      setError("Invalid opportunity ID for PDF generation.");
      console.error("Invalid opportunity ID:", opportunityId);
      return;
    }

    console.log("Using opportunity ID for PDF generation:", opportunityId);
    
    setIsGeneratingPdf(true);
    setError(null);
    setSuccess(null);

    try {
      // Always use the direct API endpoint for PDF generation with the string ID
      const pdfEndpoint = `https://link.kicknsaas.com/api/termdata/${opportunityId}/generate_pdf/`;
      console.log(`Sending PDF generation request to: ${pdfEndpoint}`);
      
      const result = await axios.post(pdfEndpoint);
      console.log("PDF generation response:", result);

      if (result.data) {
        // If there's a PDF URL returned, open it in a new tab
        if (result.data.pdf_url) {
          window.open(result.data.pdf_url, '_blank');
        }
        
        setSuccess("PDF generated successfully!");
      } else {
        setError("Failed to generate PDF.");
      }
    } catch (error) {
      console.error("PDF generation error:", error);
      setError(`Error generating PDF: ${error.response?.data?.message || error.message}`);
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
          <h2 className="text-xl text-custom">LFG Term Sheet</h2>
        </div>

        {/* Status messages */}
        {isLoading && (
          <div className="p-3 mx-4 mt-4 bg-blue-100 text-blue-800 rounded">
            Loading term sheet data...
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
        
        {/* Removed the unsaved changes indicator from here as it's now handled by the error message */}

        {/* Form fields */}
        <div className="modal-content">
          {/* Deal Info Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-custom mb-3 pb-1 border-b border-custom">
              Deal Info
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-custom mb-2">Borrower</label>
                <input
                  type="text"
                  value={termSheetData.borrower || ""}
                  onChange={(e) =>
                    handleInputChange("borrower", e.target.value)
                  }
                  className="modal-input"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
              <div>
                <label className="block text-custom mb-2">
                  Property Address
                </label>
                <input
                  type="text"
                  value={termSheetData.property_address || ""}
                  onChange={(e) => {
                    handleInputChange("property_address", e.target.value);
                    handleInputChange("propertyAddress", e.target.value);
                  }}
                  className="modal-input"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
            </div>
          </div>

          {/* Deal Structure Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-custom mb-3 pb-1 border-b border-custom">
              Deal Structure
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-custom mb-2">Loan Purpose</label>
                <input
                  type="text"
                  value={termSheetData.loanPurpose}
                  onChange={(e) =>
                    handleInputChange("loanPurpose", e.target.value)
                  }
                  className="modal-input"
                  placeholder="e.g., Fix&Flip, Purchase, Refinance"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
              <div>
                <label className="block text-custom mb-2">
                  As-Is Value / Purchase Price
                </label>
                <input
                  type="text"
                  value={termSheetData.asIsValue}
                  onChange={(e) =>
                    handleInputChange("asIsValue", e.target.value)
                  }
                  className="modal-input"
                  placeholder="$"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
              <div>
                <label className="block text-custom mb-2">Loan Amount</label>
                <input
                  type="text"
                  value={termSheetData.loanAmount}
                  onChange={(e) =>
                    handleInputChange("loanAmount", e.target.value)
                  }
                  className="modal-input"
                  placeholder="$"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
              <div>
                <label className="block text-custom mb-2">
                  Rehab Cost (if applicable)
                </label>
                <input
                  type="text"
                  value={termSheetData.rehabCost}
                  onChange={(e) =>
                    handleInputChange("rehabCost", e.target.value)
                  }
                  className="modal-input"
                  placeholder="$"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
              <div>
                <label className="block text-custom mb-2">Loan to Value</label>
                <input
                  type="text"
                  value={termSheetData.loanToValue}
                  onChange={(e) =>
                    handleInputChange("loanToValue", e.target.value)
                  }
                  className="modal-input"
                  placeholder="%"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
              <div>
                <label className="block text-custom mb-2">
                  After Repaired Value (if applicable)
                </label>
                <input
                  type="text"
                  value={termSheetData.afterRepairedValue}
                  onChange={(e) =>
                    handleInputChange("afterRepairedValue", e.target.value)
                  }
                  className="modal-input"
                  placeholder="$"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
            </div>
          </div>

          {/* Loan Terms Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-custom mb-3 pb-1 border-b border-custom">
              Loan Terms
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-custom mb-2">Loan Type</label>
                <input
                  type="text"
                  value={termSheetData.loanType}
                  onChange={(e) => {
                    handleInputChange("loanType", e.target.value);
                    handleInputChange("loan_type", e.target.value);
                  }}
                  className="modal-input"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
              <div>
                <label className="block text-custom mb-2">Interest Rate</label>
                <input
                  type="text"
                  value={termSheetData.interestRate}
                  onChange={(e) =>
                    handleInputChange("interestRate", e.target.value)
                  }
                  className="modal-input"
                  placeholder="%"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
              <div>
                <label className="block text-custom mb-2">
                  Monthly Payment (principal & interest only)
                </label>
                <input
                  type="text"
                  value={termSheetData.monthlyPayment}
                  onChange={(e) =>
                    handleInputChange("monthlyPayment", e.target.value)
                  }
                  className="modal-input"
                  placeholder="$"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
              <div>
                <label className="block text-custom mb-2">
                  PrePayment Penalty
                </label>
                <input
                  type="text"
                  value={termSheetData.prePaymentPenalty}
                  onChange={(e) =>
                    handleInputChange("prePaymentPenalty", e.target.value)
                  }
                  className="modal-input"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
            </div>
          </div>

          {/* Rest of the form fields... */}
          {/* (Preserving all the other form fields unchanged) */}
          {/* Loan Fees Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-custom mb-3 pb-1 border-b border-custom">
              Loan Fees
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-custom mb-2">
                  Origination Cost
                </label>
                <input
                  type="text"
                  value={termSheetData.originationCost}
                  onChange={(e) =>
                    handleInputChange("originationCost", e.target.value)
                  }
                  className="modal-input"
                  placeholder="$"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
              <div>
                <label className="block text-custom mb-2">
                  Cash To(-)/ From(+) Borrower
                </label>
                <input
                  type="text"
                  value={termSheetData.cashToBorrower}
                  onChange={(e) =>
                    handleInputChange("cashToBorrower", e.target.value)
                  }
                  className="modal-input"
                  placeholder="$"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
              <div>
                <label className="block text-custom mb-2">Lender Fee</label>
                <input
                  type="text"
                  value={termSheetData.lenderFee}
                  onChange={(e) =>
                    handleInputChange("lenderFee", e.target.value)
                  }
                  className="modal-input"
                  placeholder="$"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
              <div>
                <label className="block text-custom mb-2">
                  Additional Liquidity/ Reserves Required
                </label>
                <input
                  type="text"
                  value={termSheetData.additionalLiquidity}
                  onChange={(e) =>
                    handleInputChange("additionalLiquidity", e.target.value)
                  }
                  className="modal-input"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
              <div>
                <label className="block text-custom mb-2">Processing Fee</label>
                <input
                  type="text"
                  value={termSheetData.processingFee}
                  onChange={(e) =>
                    handleInputChange("processingFee", e.target.value)
                  }
                  className="modal-input"
                  placeholder="$"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              * Cash to or from borrow listed above does not include: appraisal,
              closing, legal, title, and escrow related fee's - for estimation
              of these costs, contact loan officer directly
            </div>
          </div>

          {/* Property Info Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-custom mb-3 pb-1 border-b border-custom">
              Property Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-custom mb-2">Property Type</label>
                <input
                  type="text"
                  value={termSheetData.propertyType}
                  onChange={(e) =>
                    handleInputChange("propertyType", e.target.value)
                  }
                  className="modal-input"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
              <div>
                <label className="block text-custom mb-2">Annual Taxes</label>
                <input
                  type="text"
                  value={termSheetData.annualTaxes}
                  onChange={(e) =>
                    handleInputChange("annualTaxes", e.target.value)
                  }
                  className="modal-input"
                  placeholder="$"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
              <div>
                <label className="block text-custom mb-2">FICO Score</label>
                <input
                  type="text"
                  value={termSheetData.ficoScore}
                  onChange={(e) =>
                    handleInputChange("ficoScore", e.target.value)
                  }
                  className="modal-input"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
              <div>
                <label className="block text-custom mb-2">
                  Annual Insurance
                </label>
                <input
                  type="text"
                  value={termSheetData.annualInsurance}
                  onChange={(e) =>
                    handleInputChange("annualInsurance", e.target.value)
                  }
                  className="modal-input"
                  placeholder="$"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
              <div>
                <label className="block text-custom mb-2">
                  Fair Market Rent
                </label>
                <input
                  type="text"
                  value={termSheetData.fairMarketRent}
                  onChange={(e) =>
                    handleInputChange("fairMarketRent", e.target.value)
                  }
                  className="modal-input"
                  placeholder="$"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
              <div>
                <label className="block text-custom mb-2">
                  Annual Flood Insurance
                </label>
                <input
                  type="text"
                  value={termSheetData.annualFloodInsurance}
                  onChange={(e) =>
                    handleInputChange("annualFloodInsurance", e.target.value)
                  }
                  className="modal-input"
                  placeholder="$"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
              <div>
                <label className="block text-custom mb-2">
                  Property Designation
                </label>
                <input
                  type="text"
                  value={termSheetData.propertyDesignation}
                  onChange={(e) =>
                    handleInputChange("propertyDesignation", e.target.value)
                  }
                  className="modal-input"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
              <div>
                <label className="block text-custom mb-2">
                  Annual HOA Dues
                </label>
                <input
                  type="text"
                  value={termSheetData.annualHoaDues}
                  onChange={(e) =>
                    handleInputChange("annualHoaDues", e.target.value)
                  }
                  className="modal-input"
                  placeholder="$"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
              <div>
                <label className="block text-custom mb-2">
                  Bankruptcy in last 3yrs
                </label>
                <input
                  type="text"
                  value={termSheetData.bankruptcyIn3Yrs}
                  onChange={(e) =>
                    handleInputChange("bankruptcyIn3Yrs", e.target.value)
                  }
                  className="modal-input"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
              <div>
                <label className="block text-custom mb-2">Current DSCR</label>
                <input
                  type="text"
                  value={termSheetData.currentDscr}
                  onChange={(e) =>
                    handleInputChange("currentDscr", e.target.value)
                  }
                  className="modal-input"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
              <div>
                <label className="block text-custom mb-2">
                  Foreclosures in last 3yrs
                </label>
                <input
                  type="text"
                  value={termSheetData.foreclosuresIn3Yrs}
                  onChange={(e) =>
                    handleInputChange("foreclosuresIn3Yrs", e.target.value)
                  }
                  className="modal-input"
                  disabled={isLoading || isSaving || isGeneratingPdf}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-custom mb-2">Felonies/ Crimes</label>
            <input
              type="text"
              value={termSheetData.feloniesOrCrimes}
              onChange={(e) =>
                handleInputChange("feloniesOrCrimes", e.target.value)
              }
              className="modal-input"
              disabled={isLoading || isSaving || isGeneratingPdf}
            />
          </div>

          <div className="mt-4 text-xs text-gray-500">
            Terms provided are an estimate and are subject to change if any of
            the factors listed in the deal assumptions change.
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

export default TermSheetModal;