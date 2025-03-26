import React, { useState, useEffect } from "react";
import { termSheetService } from "./services/termSheetService";
import { api } from "./services/api";

const TermSheetModal = ({ isOpen, onClose, data, onSave, onGeneratePdf }) => {
  const [termSheetData, setTermSheetData] = useState({
    // Deal Info
    borrower: "",
    propertyAddress: "",

    // Deal Structure
    loanPurpose: "",
    loanAmount: "",
    loanToValue: "",
    asIsValue: "",
    rehabCost: "",
    afterRepairedValue: "",

    // Loan Terms
    loanType: "",
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

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [termSheetId, setTermSheetId] = useState(null);

  // Load term sheet data when modal opens
  useEffect(() => {
    if (isOpen && data) {
      // Clear any previous error or success messages
      setError(null);
      setSuccess(null);
      loadTermSheetData();
    }
  }, [isOpen, data?.id]);

  // Function to load term sheet data
  const loadTermSheetData = async () => {
    if (!data || !data.id) return;
  
    setIsLoading(true);
    setError(null);
  
    try {
      // Try to get existing term sheet data
      const result = await termSheetService.getByOpportunityId(data.id);
  
      if (result.success) {
        // We found term data, load it and convert snake_case to camelCase
        const apiData = result.data;
        setTermSheetData({
          // REMOVE THE ...termSheetData SPREAD OPERATOR HERE
          borrower: apiData.borrower || "",
          property_address: apiData.property_address || "",
          propertyAddress: apiData.property_address || "",
          loanPurpose: apiData.loan_purpose || "",
          loanAmount: apiData.loan_amount || "",
          loanToValue: apiData.loan_to_value || "",
          asIsValue: apiData.as_is_value || "",
          rehabCost: apiData.rehab_cost || "",
          afterRepairedValue: apiData.after_repaired_value || "",
          loanType: apiData.loan_type || "",
          loan_type: apiData.loan_type || "",
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
          opportunity: apiData.opportunity || data.id,
        });
        setTermSheetId(apiData.id);
      } else {
        // No term data found, initialize with data from the opportunity
        setTermSheetData({
          // REMOVE THE ...termSheetData SPREAD OPERATOR HERE
          // Reset all fields to empty
          borrower: data.name || "",
          property_address: data.opportunityName || "",
          propertyAddress: data.opportunityName || "",
          loan_type: data.loan_type || "",
          loanType: data.loan_type || "",
          loan_amount: data.monetaryValue ? data.monetaryValue.toString().replace("$", "") : "",
          loanAmount: data.monetaryValue ? data.monetaryValue.toString().replace("$", "") : "",
          opportunity: data.id,
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
        });
        setTermSheetId(null);
      }
    } catch (error) {
      setError("Failed to load term sheet data.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setTermSheetData({
      ...termSheetData,
      [field]: value,
    });
  };

  // Handle save button click
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
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
        opportunity: data.id,
      };

      console.log("Saving data to API:", convertedData);

      let result;
      if (termSheetId) {
        // Update existing term data
        result = await termSheetService.updateTermSheet(
          termSheetId,
          convertedData
        );
      } else {
        // Create new term data
        result = await termSheetService.createTermSheet(convertedData);
      }

      if (result.success) {
        // Save was successful
        setSuccess(
          termSheetId
            ? "Term sheet updated successfully!"
            : "Term sheet created successfully!"
        );

        // If we created a new term sheet, store its ID
        if (!termSheetId && result.data && result.data.id) {
          setTermSheetId(result.data.id);
        }
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
    if (!termSheetId) {
      setError("Please save the term sheet before generating a PDF.");
      return;
    }

    setIsGeneratingPdf(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await termSheetService.generatePdf(termSheetId);

      if (result.success) {
        setSuccess("PDF generated successfully!");
      } else {
        setError(result.message || "Failed to generate PDF.");
      }
    } catch (error) {
      setError("An unexpected error occurred while generating PDF.");
      console.error(error);
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

        {/* Form fields - Keep your existing form fields but add "disabled={isLoading || isSaving}" */}
        <div className="modal-content">
          {/* Your existing form fields would go here */}
          {/* Example of one section: */}
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
                  onChange={(e) =>
                    handleInputChange("property_address", e.target.value)
                  }
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
                  onChange={(e) =>
                    handleInputChange("loanType", e.target.value)
                  }
                  className="modal-input"
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
                />
              </div>
            </div>
          </div>

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
            disabled={isLoading || isSaving || isGeneratingPdf || !termSheetId}
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
