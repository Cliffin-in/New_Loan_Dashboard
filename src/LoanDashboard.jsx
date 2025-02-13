import React, { useState, useEffect } from "react";
import { Pencil, Eye, ArrowUpDown, Sun, Moon } from "lucide-react";
import { Select } from "./components/ui/select";
import FilterSelect from "./FilterSelect";
import DateRangeFilter from "./DateRangeFilter";
import SearchField from "./SearchField";
import { useAccess } from "./AccessControl";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./index.css";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./components/ui/tooltip";
import { api } from "./services/api";
// import { data as initialData } from "./data/loanData";

const standardizeString = (str) => str?.trim().toLowerCase();

const LoanDashboard = () => {
  // const [data, setData] = useState(initialData);
  const { permissions } = useAccess();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [tableError, setTableError] = useState(null);

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("dashboard-theme");
    return savedTheme || "light";
  });

  // State for filters
  const [filters, setFilters] = useState({
    assignedUser: [], // Changed from "" to []
    pipeline: [],
    pipelineStage: [],
    stage: [],
    actualClosingDateFrom: null,
    actualClosingDateTo: null,
    originalClosingDateFrom: null,
    originalClosingDateTo: null,
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [viewingData, setViewingData] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    loadData();
  }, []);

  // Add data loading function
  const loadData = async () => {
    try {
      setIsLoading(true); // Show full-screen loading only on initial load
      setIsTableLoading(true); // Show table loading animation
      setTableError(null); // Clear previous errors

      const opportunities = await api.getAllOpportunities();
      setData(opportunities);
    } catch (error) {
      setTableError("⚠️ Failed to load opportunities. Please try again.");
      console.error("🔴 Error loading data:", error);
    } finally {
      setIsLoading(false); // Remove full-screen loading
      setIsTableLoading(false); // Remove table loading animation
    }
  };

  // Function to check if today is Tuesday
  const isTuesday = () => {
    return new Date().getDay() === 2;
  };

  // Function to check if a record was flagged before today
  const wasFlaggedBeforeToday = (lastModifiedDate) => {
    if (!lastModifiedDate) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const modifiedDate = new Date(lastModifiedDate);
    modifiedDate.setHours(0, 0, 0, 0);

    return modifiedDate < today;
  };

  // Function to reset Follow Up Friday flags
  const resetFollowUpFlags = async () => {
    try {
      setIsTableLoading(true);

      // Only get records that were flagged before today
      const recordsToUpdate = data.filter(
        (record) =>
          record.followUpFriday &&
          wasFlaggedBeforeToday(record.lastModifiedDate)
      );

      if (recordsToUpdate.length === 0) {
        console.log("🟢 No records need resetting");
        return;
      }

      // Update each record
      const updatePromises = recordsToUpdate.map((record) => {
        const updatedData = {
          updates: {
            followUpFriday: false,
            lastModifiedDate: new Date().toISOString(),
          },
        };
        return api.updateOpportunity(record.id, record, updatedData);
      });

      await Promise.all(updatePromises);

      // Update local state, but only for records flagged before today
      setData((prevData) =>
        prevData.map((record) => ({
          ...record,
          followUpFriday:
            record.followUpFriday &&
            !wasFlaggedBeforeToday(record.lastModifiedDate),
        }))
      );

      console.log(
        "🟢 Successfully reset Follow Up Friday flags for old records"
      );
    } catch (error) {
      console.error("🔴 Error resetting Follow Up Friday flags:", error);
      setError("Failed to reset follow-up flags.");
    } finally {
      setIsTableLoading(false);
    }
  };

  // Add this useEffect to check for Tuesday and reset flags
  useEffect(() => {
    // Only run once when the dashboard is first opened on a Tuesday
    if (isTuesday()) {
      resetFollowUpFlags();
    }
  }, []); // Only run on component mount

  // Handle refresh button click
  const handleRefresh = () => {
    setIsTableLoading(true); // Show loading state in table
    setTableError(null); // Reset error before refreshing
    loadData();
  };

  // Handle save in EditModal
  const handleSave = async (id, originalData, updatedData) => {
    console.log(
      "🟢 handleSave in LoanDashboard triggered with:",
      id,
      updatedData
    );

    try {
      setIsLoading(true);

      // Ensure API function exists
      if (!api || !api.updateOpportunity) {
        console.error("🔴 API function is undefined!");
        return;
      }

      await api.updateOpportunity(id, originalData, updatedData);

      console.log("🟢 API request sent successfully");

      const updatedRowData = await api.getOpportunityById(id);

      setData((prevData) =>
        prevData.map((item) => (item.id === id ? updatedRowData : item))
      );

      setIsEditModalOpen(false);
    } catch (error) {
      console.error("🔴 Error in LoanDashboard handleSave:", error);
      setError("Failed to update opportunity. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);

    if (theme === "light") {
      document.documentElement.style.setProperty("--bg-color", "white");
      document.documentElement.style.setProperty("--text-color", "#1f2937");
      document.documentElement.style.setProperty("--border-color", "#e5e7eb");
      document.documentElement.style.setProperty("--hover-bg", "#f3f4f6");
      document.documentElement.style.setProperty(
        "--table-header-bg",
        "#f9fafb"
      );
      document.documentElement.style.setProperty(
        "--table-row-hover-bg",
        "#f1f5f9"
      );
      document.documentElement.style.setProperty("--table-bg", "white");
      document.documentElement.style.setProperty("--input-bg", "white");

      // Default row background color (only applied when stage-based color is not set)
      document.documentElement.style.setProperty("--row-bg-color", "white");
    } else {
      document.documentElement.style.setProperty("--bg-color", "#0a0c10");
      document.documentElement.style.setProperty("--text-color", "#d1d5db");
      document.documentElement.style.setProperty("--border-color", "#30363d");
      document.documentElement.style.setProperty("--hover-bg", "#21262d");
      document.documentElement.style.setProperty(
        "--table-header-bg",
        "#353a41"
      );
      document.documentElement.style.setProperty(
        "--table-row-hover-bg",
        "#1f2937"
      );
      document.documentElement.style.setProperty("--table-bg", "#0d1117");
      document.documentElement.style.setProperty("--input-bg", "#161b22");

      // Default row background color (only applied when stage-based color is not set)
      document.documentElement.style.setProperty("--row-bg-color", "#0a0c10");
    }
  }, [theme]);

  // Theme toggle function
  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "dark" ? "light" : "dark";

      localStorage.setItem("dashboard-theme", newTheme);
      return newTheme;
    });
  };

  const uniqueAssignedUsers = [...new Set(
    data
      .map(item => item.assignedUser)
      .filter(Boolean)
      .map(user => user.trim())
  )]
  .sort((a, b) => a.localeCompare(b));

  const uniquePipelines = [...new Set(
  data
    .map(item => item.pipeline)
    .filter(Boolean)
    .map(pipeline => pipeline.trim())
)]
.sort((a, b) => a.localeCompare(b));

  const uniquePipelineStages = [
    ...new Set(
      data
        .map((item) => item.pipelineStage)
        .filter(Boolean)
        .map((stage) => stage.trim())
    ),
  ].sort((a, b) => b.localeCompare(a));

  const uniqueStages = [...new Set(
  data
    .map(item => item.stage)
    .filter(Boolean)
    .map(stage => stage.trim())
)]
.sort((a, b) => b.localeCompare(a));

  // Inside your LoanDashboard component, replace the existing date filtering logic with this:

  const filteredData = data.filter((item) => {
    // Basic search filter
    const matchesSearch = Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Helper function to start of day
    const getStartOfDay = (date) => {
      if (!date) return null;
      const newDate = new Date(date);
      newDate.setHours(0, 0, 0, 0);
      return newDate;
    };

    // Helper function to end of day
    const getEndOfDay = (date) => {
      if (!date) return null;
      const newDate = new Date(date);
      newDate.setHours(23, 59, 59, 999);
      return newDate;
    };

    // Actual closing date filtering
    const itemActualDate = item.actualClosingDate
      ? new Date(item.actualClosingDate)
      : null;
    const actualFromDate = filters.actualClosingDateFrom
      ? getStartOfDay(filters.actualClosingDateFrom)
      : null;
    const actualToDate = filters.actualClosingDateTo
      ? getEndOfDay(filters.actualClosingDateTo)
      : null;

    const matchesActualDateFilter = (() => {
      // If no date filter is set, include all records
      if (!actualFromDate && !actualToDate) return true;

      // If date filter is set but item has no date, exclude it
      if (!itemActualDate) return false;

      // For single date filter (when from and to dates are the same)
      if (
        actualFromDate &&
        actualToDate &&
        actualFromDate.toDateString() === actualToDate.toDateString()
      ) {
        return itemActualDate.toDateString() === actualFromDate.toDateString();
      }

      // For date range
      if (actualFromDate && actualToDate) {
        return (
          itemActualDate >= actualFromDate && itemActualDate <= actualToDate
        );
      }

      // If only from date is set
      if (actualFromDate) {
        return itemActualDate >= actualFromDate;
      }

      // If only to date is set
      if (actualToDate) {
        return itemActualDate <= actualToDate;
      }

      return true;
    })();

    // Original closing date filtering
    const itemOriginalDate = item.originalClosingDate
      ? new Date(item.originalClosingDate)
      : null;
    const originalFromDate = filters.originalClosingDateFrom
      ? getStartOfDay(filters.originalClosingDateFrom)
      : null;
    const originalToDate = filters.originalClosingDateTo
      ? getEndOfDay(filters.originalClosingDateTo)
      : null;

    const matchesOriginalDateFilter = (() => {
      // If no date filter is set, include all records
      if (!originalFromDate && !originalToDate) return true;

      // If date filter is set but item has no date, exclude it
      if (!itemOriginalDate) return false;

      // For single date filter (when from and to dates are the same)
      if (
        originalFromDate &&
        originalToDate &&
        originalFromDate.toDateString() === originalToDate.toDateString()
      ) {
        return (
          itemOriginalDate.toDateString() === originalFromDate.toDateString()
        );
      }

      // For date range
      if (originalFromDate && originalToDate) {
        return (
          itemOriginalDate >= originalFromDate &&
          itemOriginalDate <= originalToDate
        );
      }

      // If only from date is set
      if (originalFromDate) {
        return itemOriginalDate >= originalFromDate;
      }

      // If only to date is set
      if (originalToDate) {
        return itemOriginalDate <= originalToDate;
      }

      return true;
    })();

    // Combine all filters
    return (
      matchesSearch &&
      (filters.assignedUser.length === 0 ||
        filters.assignedUser.includes(item.assignedUser)) &&
      (filters.pipeline.length === 0 ||
        filters.pipeline.includes(item.pipeline)) &&
      (filters.pipelineStage.length === 0 ||
        (item.pipelineStage &&
          filters.pipelineStage.some(
            (filterStage) =>
              standardizeString(filterStage) ===
              standardizeString(item.pipelineStage)
          ))) &&
      (filters.stage.length === 0 || filters.stage.includes(item.stage)) &&
      matchesActualDateFilter &&
      matchesOriginalDateFilter
    );
  });

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sorted data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0;
    if (typeof a[sortField] === "number") {
      return sortDirection === "asc"
        ? a[sortField] - b[sortField]
        : b[sortField] - a[sortField];
    }
    return sortDirection === "asc"
      ? String(a[sortField]).localeCompare(String(b[sortField]))
      : String(b[sortField]).localeCompare(String(a[sortField]));
  });

  // Paginated data
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterName]: value,
    }));
    setCurrentPage(1);
  };

  // Handle reset filters
  const resetFilters = () => {
    setFilters({
      assignedUser: [],
      pipeline: [],
      pipelineStage: [],
      stage: [],
      actualClosingDateFrom: null,
      actualClosingDateTo: null,
      originalClosingDateFrom: null,
      originalClosingDateTo: null,
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  const SortableHeader = ({ field, children }) => (
    <div
      className="flex items-center justify-between cursor-pointer group"
      onClick={() => handleSort(field)}
    >
      <span>{children}</span>
      <div className="p-1 rounded-md group-hover:bg-[#4f46e5] transition-colors">
        <ArrowUpDown
          className={`w-4 h-4 text-custom group-hover:text-white transition-transform ${
            sortField === field
              ? sortDirection === "asc"
                ? "rotate-180"
                : ""
              : ""
          }`}
        />
      </div>
    </div>
  );

  const generateLFGUrl = (pipeline = "", opportunityName = "") => {
    const baseUrl =
      "https://app.lfglending.com/v2/location/NqyhE9rC0Op4IlSj2IIZ/opportunities/list";

    const encodeCustom = (str) => str.replace(/ /g, "%20");

    const encodedPipeline = encodeCustom(pipeline);
    const encodedOpportunityName = encodeCustom(opportunityName);

    // Build query string
    const queryParams = [];
    if (encodedPipeline) queryParams.push(`pipeline=${encodedPipeline}`);
    if (encodedOpportunityName)
      queryParams.push(`opportunityName=${encodedOpportunityName}`);

    const queryString = queryParams.join("&");

    return `${baseUrl}${queryString ? "?" + queryString : ""}`;
  };

  const EditModal = ({ isOpen, onClose, data, uniqueStages, onSave }) => {
    const [editedData, setEditedData] = useState(data);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [originalData, setOriginalData] = useState(null);
    const [pipelineData, setPipelineData] = useState([]);
    const [availablePipelineStages, setAvailablePipelineStages] = useState([]);

    useEffect(() => {
      const fetchPipelineData = async () => {
        try {
          const response = await api.getPipelineStages();
          console.log("🔹 Pipeline Data Response:", response);

          if (!response || !response.pipelines) {
            throw new Error("No pipeline data found.");
          }

          const formattedPipelines = response.pipelines.map((pipeline) => {
            const pipelineName = Object.keys(pipeline)[0];
            const stages = pipeline[pipelineName].map((stage) => ({
              id: stage.id, // Ensure ID is included
              name: stage.name,
            }));

            return { name: pipelineName, stages };
          });

          setPipelineData(formattedPipelines);

          // Find the currently selected pipeline stages
          const currentPipeline = formattedPipelines.find(
            (p) => p.name === editedData.pipeline
          );

          if (currentPipeline) {
            console.log("🟢 Found Pipeline Stages:", currentPipeline.stages);
            setAvailablePipelineStages(currentPipeline.stages);
          } else {
            console.error("❌ No matching pipeline found.");
            setAvailablePipelineStages([]);
          }
        } catch (err) {
          console.error("🔴 Error fetching pipeline stages:", err);
          setError(
            "Failed to load pipeline stages. Please check API connection."
          );
        }
      };

      if (isOpen && editedData) {
        fetchPipelineData();
      }
    }, [isOpen, editedData?.pipeline]);

    // Reset form when modal opens with new data
    useEffect(() => {
      if (data) {
        setEditedData(data);
        setOriginalData(data);
        setError(null);
      }
    }, [data]);

    if (!isOpen || !data) return null;

    const handleSave = async () => {
      console.log("🟢 handleSave function triggered");

      try {
        setIsSaving(true);
        setError(null);

        console.log("🔹 Original Data:", originalData);
        console.log("🔹 Edited Data:", editedData);

        let updates = {};

        if (editedData.pipelineStage !== originalData.pipelineStage) {
          console.log("🔹 Pipeline Stage Changed:", editedData.pipelineStage);

          // Ensure availablePipelineStages is populated
          if (
            !availablePipelineStages ||
            availablePipelineStages.length === 0
          ) {
            console.warn("⚠️ No available pipeline stages found.");
          } else {
            const selectedStage = availablePipelineStages.find(
              (stage) => stage.name === editedData.pipelineStage
            );

            if (selectedStage) {
              console.log(
                "🟢 Found Matching Pipeline Stage ID:",
                selectedStage.id
              );
              updates.pipelineStage = editedData.pipelineStage;
              updates.pipelineStageId = selectedStage.id; // ✅ Assign the correct ID
            } else {
              console.warn("⚠️ No matching pipeline stage found!");
            }
          }
        }

        if (editedData.stage !== originalData.stage) {
          console.log("🔹 Stage Changed:", editedData.stage);
          updates.stage = editedData.stage;
        }
        if (editedData.actualClosingDate !== originalData.actualClosingDate) {
          console.log(
            "🔹 Actual Closing Date Changed:",
            editedData.actualClosingDate
          );
          updates.actualClosingDate = editedData.actualClosingDate;
        }
        if (editedData.followUpFriday !== originalData.followUpFriday) {
          console.log(
            "🔹 Follow Up Friday Changed:",
            editedData.followUpFriday
          );
          updates.followUpFriday = editedData.followUpFriday;
        }
        if (editedData.dealNotes !== originalData.dealNotes) {
          console.log("🔹 Deal Notes Changed:", editedData.dealNotes);
          updates.dealNotes = editedData.dealNotes;
        }
        if (editedData.appraisalNotes !== originalData.appraisalNotes) {
          console.log("🔹 Appraisal Notes Changed:", editedData.appraisalNotes);
          updates.appraisalNotes = editedData.appraisalNotes;
        }
        if (editedData.insuranceNotes !== originalData.insuranceNotes) {
          console.log("🔹 Insurance Notes Changed:", editedData.insuranceNotes);
          updates.insuranceNotes = editedData.insuranceNotes;
        }
        if (editedData.titleNotes !== originalData.titleNotes) {
          console.log("🔹 Title Notes Changed:", editedData.titleNotes);
          updates.titleNotes = editedData.titleNotes;
        }

        console.log("🟢 Final Updates Object:", updates);

        if (Object.keys(updates).length === 0) {
          console.warn("⚠️ No changes detected, skipping API request.");
          setIsSaving(false);
          return;
        }

        const payload = {
          id: data.id,
          pipeline: originalData.pipeline,
          updates: updates,
        };

        console.log(
          "🟢 API Request Payload:",
          JSON.stringify(payload, null, 2)
        );

        await onSave(data.id, originalData, payload);

        console.log("🟢 handleSave executed successfully");

        onClose();
      } catch (err) {
        console.error("🔴 Error in handleSave:", err);
        setError("Failed to save changes. Please try again.");
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <div className="modal-backdrop">
        <div className="modal-container">
          {/* Fixed Header */}
          <div className="modal-header">
            <h2 className="text-xl text-custom">Edit Record Details</h2>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Scrollable Content */}
          <div className="modal-content">
            {/* Read-only Fields */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-custom mb-2">Name</label>
                <input
                  type="text"
                  value={editedData.name}
                  readOnly
                  className="modal-input"
                />
              </div>
              <div>
                <label className="block text-custom mb-2">
                  Opportunity Name
                </label>
                <input
                  type="text"
                  value={editedData.opportunityName}
                  readOnly
                  className="modal-input"
                />
              </div>
            </div>

            {/* Editable Fields */}
            <div className="space-y-4">
              {/* Dropdowns */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-custom mb-2">
                    Pipeline Stage
                  </label>
                  <Select
                    value={editedData.pipelineStage || ""}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        pipelineStage: e.target.value,
                      })
                    }
                  >
                    {availablePipelineStages.length > 0 ? (
                      availablePipelineStages.map((stage) => (
                        <option key={stage.id} value={stage.name}>
                          {stage.name}
                        </option>
                      ))
                    ) : (
                      <option value="">No stages available</option>
                    )}
                  </Select>
                </div>
                <div>
                  <label className="block text-custom mb-2">Stage</label>
                  <Select
                    value={editedData.stage || ""}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        stage: e.target.value,
                      })
                    }
                    className="input-custom w-full"
                  >
                    {uniqueStages
                      .filter((stage) => stage && stage.trim() !== "")
                      .map((stage) => (
                        <option key={stage} value={stage}>
                          {stage}
                        </option>
                      ))}
                  </Select>
                </div>
              </div>

              {/* Date and Follow Up Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-custom mb-2">
                    Actual Closing Date
                  </label>
                  <DatePicker
                    selected={
                      editedData.actualClosingDate
                        ? new Date(editedData.actualClosingDate)
                        : null
                    }
                    onChange={(date) =>
                      setEditedData({
                        ...editedData,
                        actualClosingDate: date
                          ? date.toISOString().split("T")[0]
                          : null,
                      })
                    }
                    className="w-full bg-[#161b22] text-custom border-custom rounded-md p-2"
                    dateFormat="yyyy-MM-dd"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-custom cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={editedData.followUpFriday || false}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          followUpFriday: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300 bg-[#161b22] text-[#238636] focus:ring-[#238636]"
                    />
                    Follow Up Friday
                  </label>
                </div>
              </div>

              {/* Notes Fields */}
              {[
                { key: "dealNotes", label: "Deal Notes" },
                { key: "appraisalNotes", label: "Appraisal Notes" },
                { key: "insuranceNotes", label: "Insurance Notes" },
                { key: "titleNotes", label: "Title Notes" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-custom mb-2">{label}</label>
                  <textarea
                    value={editedData[key] || ""}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        [key]: e.target.value,
                      })
                    }
                    className="modal-input modal-textarea"
                    placeholder={`Enter ${label.toLowerCase()}...`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="modal-footer">
            <button onClick={onClose} className="btn-base" disabled={isSaving}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn-success"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ViewModal = ({
    isOpen,
    onClose,
    data,
    onEdit,
    showEditButton = true,
  }) => {
    if (!isOpen || !data) return null;

    return (
      <div className="modal-backdrop">
        <div className="modal-container">
          {/* Fixed Header */}
          <div className="modal-header">
            <h2 className="text-xl text-custom">View Record Details</h2>
          </div>

          {/* Scrollable Content */}
          <div className="modal-content">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-custom mb-2">Name</label>
                <div className="modal-input">{data.name}</div>
              </div>
              <div>
                <label className="block text-custom mb-2">
                  Opportunity Name
                </label>
                <div className="modal-input">{data.opportunityName}</div>
              </div>
            </div>

            {/* Pipeline Information */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-custom mb-2">Pipeline Stage</label>
                <div className="input-custom w-full">{data.pipelineStage}</div>
              </div>
              <div>
                <label className="block text-custom mb-2">Stage</label>
                <div className="input-custom w-full">{data.stage}</div>
              </div>
            </div>

            {/* Closing Date and Follow Up */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-custom mb-2">
                  Actual Closing Date
                </label>
                <div className="input-custom w-full">
                  {data.actualClosingDate || "Not set"}
                </div>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-custom cursor-not-allowed mb-2">
                  <input
                    type="checkbox"
                    checked={data.followUpFriday || false}
                    disabled
                    className="h-4 w-4 rounded border-gray-300 bg-[#161b22] text-[#238636] focus:ring-[#238636]"
                  />
                  Follow Up Friday
                </label>
              </div>
            </div>

            {/* Notes Fields */}
            <div className="space-y-4">
              {[
                { key: "dealNotes", label: "Deal Notes" },
                { key: "appraisalNotes", label: "Appraisal Notes" },
                { key: "insuranceNotes", label: "Insurance Notes" },
                { key: "titleNotes", label: "Title Notes" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-custom mb-2">{label}</label>
                  <div className="modal-input modal-textarea whitespace-pre-wrap">
                    {data[key] || "No notes available"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="modal-footer">
            <button onClick={onClose} className="btn-base">
              Close
            </button>
            {showEditButton && onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(data);
                }}
                className="btn-success"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading && !data.length) {
    return (
      <div className="h-screen flex items-center justify-center bg-custom">
        <div className="text-custom">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-b-blue-500 rounded-full animate-spin"></div>
          <div className="mt-4">Loading...</div>
        </div>
      </div>
    );
  }

  if (error && !data.length) {
    return (
      <div className="h-screen flex items-center justify-center bg-custom">
        <div className="text-red-500">
          <div className="mb-4">{error}</div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-custom overflow-hidden">
      {/* Header Section */}
      <div className="p-4 border border-custom bg-custom rounded-t-lg">
        <div className="grid grid-cols-4 gap-4">
          <FilterSelect
            label="Loan Officer"
            selectedValues={filters.assignedUser}
            onChange={(values) => handleFilterChange("assignedUser", values)}
            onClear={() => handleFilterChange("assignedUser", [])}
            options={uniqueAssignedUsers}
          />

          <FilterSelect
            label="Pipeline Name"
            selectedValues={filters.pipeline}
            onChange={(values) => handleFilterChange("pipeline", values)}
            onClear={() => handleFilterChange("pipeline", [])}
            options={uniquePipelines}
          />

          <FilterSelect
            label="Pipeline Stage"
            selectedValues={filters.pipelineStage}
            onChange={(values) => handleFilterChange("pipelineStage", values)}
            onClear={() => handleFilterChange("pipelineStage", [])}
            options={uniquePipelineStages}
          />

          <FilterSelect
            label="Loan Stage"
            selectedValues={filters.stage}
            onChange={(values) => handleFilterChange("stage", values)}
            onClear={() => handleFilterChange("stage", [])}
            options={uniqueStages}
          />
        </div>
        {/* Date Range Filters */}
        {/* Replace the existing date range filters with this code */}
        <div className="grid grid-cols-3 gap-4 mt-4 px-2">
          {/* Actual Closing Date Range */}
          <DateRangeFilter
            label="Actual Closing Date Range"
            fromDate={filters.actualClosingDateFrom}
            toDate={filters.actualClosingDateTo}
            onFromChange={(date) =>
              handleFilterChange("actualClosingDateFrom", date)
            }
            onToChange={(date) =>
              handleFilterChange("actualClosingDateTo", date)
            }
            onFromClear={() =>
              handleFilterChange("actualClosingDateFrom", null)
            }
            onToClear={() => handleFilterChange("actualClosingDateTo", null)}
          />

          {/* Original Closing Date Range */}
          <DateRangeFilter
            label="Original Closing Date Range"
            fromDate={filters.originalClosingDateFrom}
            toDate={filters.originalClosingDateTo}
            onFromChange={(date) =>
              handleFilterChange("originalClosingDateFrom", date)
            }
            onToChange={(date) =>
              handleFilterChange("originalClosingDateTo", date)
            }
            onFromClear={() =>
              handleFilterChange("originalClosingDateFrom", null)
            }
            onToClear={() => handleFilterChange("originalClosingDateTo", null)}
          />

          {/* Reset Filters Button */}
          <div className="flex justify-end items-end">
            <button className="btn-base btn-primary" onClick={resetFilters}>
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Search and Actions Section */}
      <div className="px-4 py-3 border-x border-b border-custom bg-custom">
        <SearchField
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm("")}
          onRefresh={handleRefresh}
        />
      </div>

      {/* Table Section */}
      <div className="flex-1 min-h-0 p-4 bg-custom table-container scrollable-container">
        <div className="h-full overflow-auto border border-custom rounded-md bg-custom">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-20 bg-custom">
              <tr>
                {/* Fix the first three headers */}
                <th className="sticky left-0 z-30 bg-custom px-6 py-3 text-left text-custom font-medium border border-custom min-w-[200px]">
                  <SortableHeader field="name">Name</SortableHeader>
                </th>
                <th className="sticky left-[200px] z-30 bg-custom px-6 py-3 text-left text-custom font-medium border border-custom min-w-[300px]">
                  Opportunity Name
                </th>
                <th className="sticky left-[500px] z-30 bg-custom px-6 py-3 text-left text-custom font-medium border border-custom min-w-[100px]">
                  Actions
                </th>
                {/* Remaining headers */}
                <th className="px-6 py-3  text-left text-custom font-medium border border-custom min-w-[300px]">
                  Business Name
                </th>
                <th className="px-6 py-3 text-left text-custom font-medium border border-custom min-w-[220px]">
                  Pipeline
                </th>
                <th className="px-6 py-3 text-left text-custom font-medium border border-custom min-w-[200px]">
                  Pipeline Stage
                </th>
                <th className="px-6 py-3 text-left text-custom font-medium border border-custom min-w-[200px]">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-custom font-medium border border-custom min-w-[250px]">
                  <SortableHeader field="actualClosingDate">
                    Actual Closing Date
                  </SortableHeader>
                </th>
                <th className="px-6 py-3 text-left text-custom font-medium border border-custom min-w-[250px]">
                  <SortableHeader field="originalClosingDate">
                    Original Closing Date
                  </SortableHeader>
                </th>
                <th className="px-6 py-3 text-left text-custom font-medium border border-custom min-w-[220px]">
                  <SortableHeader field="monetaryValue">
                    Monetary Value
                  </SortableHeader>
                </th>
                <th className="px-6 py-3 text-left text-custom font-medium border border-custom min-w-[170px]">
                  Assigned User
                </th>
                <th className="px-6 py-3 text-left text-custom font-medium border border-custom min-w-[200px]">
                  Lender
                </th>
                <th className="px-6 py-3 text-left text-custom font-medium border border-custom min-w-[460px]">
                  Deal Notes
                </th>
                <th className="px-6 py-3 text-left text-custom font-medium border border-custom min-w-[460px]">
                  Appraisal Notes
                </th>
                <th className="px-6 py-3 text-left text-custom font-medium border border-custom min-w-[460px]">
                  Insurance Notes
                </th>
                <th className="px-6 py-3 text-left text-custom font-medium border border-custom min-w-[460px]">
                  Title Notes
                </th>
                <th className="px-6 py-3 text-left text-custom font-medium border border-custom min-w-[190px]">
                  Follow Up Friday
                </th>
              </tr>
            </thead>
            <tbody>
              {isTableLoading ? (
                <tr>
                  <td colSpan="17" style={{ height: "400px", width: "100%" }}>
                    <div
                      style={{
                        position: "fixed",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "auto",
                      }}
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-t-blue-500 border-b-blue-500 rounded-full animate-spin"></div>
                        <div className="mt-4 text-custom">
                          Refreshing Data...
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : tableError ? (
                <tr>
                  <td colSpan="17" style={{ height: "400px", width: "100%" }}>
                    <div
                      style={{
                        position: "fixed",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "auto",
                      }}
                    >
                      <div className="text-red-500 text-lg">{tableError}</div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr
                    key={row.id}
                    data-stage={row.stage}
                    className="hover:opacity-90"
                  >
                    {/* Fix the first three columns */}
                    <td className="sticky left-0 z-10 bg-custom px-6 py-4 text-custom border border-custom min-w-[200px]">
                      <a
                        href={generateLFGUrl(row.pipeline, row.opportunityName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-custom hover:text-blue-500 transition-colors duration-200"
                      >
                        {row.name}
                      </a>
                    </td>
                    <td className="sticky left-[200px] z-10 bg-custom px-6 py-4 text-custom border border-custom min-w-[300px]">
                      <a
                        href={generateLFGUrl(row.pipeline, row.opportunityName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-custom hover:text-blue-500 transition-colors duration-200"
                      >
                        {row.opportunityName}
                      </a>
                    </td>
                    <td className="sticky left-[500px] z-10 bg-custom px-6 py-4 border border-custom min-w-[100px]">
                      <div
                        className={`flex ${
                          permissions.canEdit
                            ? "gap-2"
                            : "justify-center w-full"
                        }`}
                      >
                        {permissions.canEdit && (
                          <button
                            className="p-1.5 bg-gray-800/50 rounded-md hover:bg-[#4f46e5] transition-colors"
                            onClick={() => {
                              setEditingData(row);
                              setIsEditModalOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4 text-white" />
                          </button>
                        )}
                        <a
                          href={generateLFGUrl(
                            row.pipeline,
                            row.opportunityName
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-gray-800/50 rounded-md hover:bg-[#4f46e5] transition-colors inline-flex items-center relative justify-center"
                        >
                          <Eye className="w-4 h-4 text-white" />
                        </a>
                      </div>
                    </td>
                    {/* Remaining cells */}
                    <td className="px-6 py-4 text-custom border border-custom">
                      {row.businessName}
                    </td>
                    <td className="px-6 py-4 text-custom border border-custom">
                      {row.pipeline}
                    </td>
                    <td className="px-6 py-4 text-custom border border-custom">
                      {row.pipelineStage}
                    </td>
                    <td className="px-6 py-4 text-custom border border-custom">
                      {row.stage}
                    </td>
                    <td className="px-6 py-4 text-custom border border-custom">
                      {row.actualClosingDate}
                    </td>
                    <td className="px-6 py-4 text-custom border border-custom">
                      {row.originalClosingDate}
                    </td>
                    <td className="px-6 py-4 text-custom border border-custom">
                      ${row.monetaryValue}
                    </td>
                    <td className="px-6 py-4 text-custom border border-custom">
                      {row.assignedUser}
                    </td>
                    <td className="px-6 py-4 text-custom border border-custom">
                      {row.lender}
                    </td>
                    <td className="px-6 py-4 text-custom border border-custom">
                      <div className="relative">
                        <div className="line-clamp-1 whitespace-pre-line">
                          {row.dealNotes}
                        </div>
                        {row.dealNotes &&
                          (row.dealNotes.length > 100 ||
                            row.dealNotes.split("\n").length > 3) && (
                            <button
                              onClick={() => {
                                setViewingData(row);
                                setIsViewModalOpen(true);
                              }}
                              className="text-blue-500 hover:text-blue-400 text-sm mt-1"
                            >
                              See more
                            </button>
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-custom border border-custom">
                      <div className="relative">
                        <div className="line-clamp-1 whitespace-pre-line">
                          {row.appraisalNotes}
                        </div>
                        {row.appraisalNotes &&
                          (row.appraisalNotes.length > 100 ||
                            row.appraisalNotes.split("\n").length > 3) && (
                            <button
                              onClick={() => {
                                setViewingData(row);
                                setIsViewModalOpen(true);
                              }}
                              className="text-blue-500 hover:text-blue-400 text-sm mt-1"
                            >
                              See more
                            </button>
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-custom border border-custom">
                      <div className="relative">
                        <div className="line-clamp-1 whitespace-pre-line">
                          {row.insuranceNotes}
                        </div>
                        {row.insuranceNotes &&
                          (row.insuranceNotes.length > 100 ||
                            row.insuranceNotes.split("\n").length > 3) && (
                            <button
                              onClick={() => {
                                setViewingData(row);
                                setIsViewModalOpen(true);
                              }}
                              className="text-blue-500 hover:text-blue-400 text-sm mt-1"
                            >
                              See more
                            </button>
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-custom border border-custom">
                      <div className="relative">
                        <div className="line-clamp-1 whitespace-pre-line">
                          {row.titleNotes}
                        </div>
                        {row.titleNotes &&
                          (row.titleNotes.length > 100 ||
                            row.titleNotes.split("\n").length > 3) && (
                            <button
                              onClick={() => {
                                setViewingData(row);
                                setIsViewModalOpen(true);
                              }}
                              className="text-blue-500 hover:text-blue-400 text-sm mt-1"
                            >
                              See more
                            </button>
                          )}
                      </div>
                    </td>
                    <td
                      className={`px-6 py-4 text-custom border border-custom text-center relative`}
                    >
                      <div
                        className="absolute inset-0 z-0"
                        style={{
                          backgroundColor: row.followUpFriday
                            ? "#4EB0AA"
                            : "transparent",
                        }}
                      ></div>
                      <input
                        type="checkbox"
                        checked={row.followUpFriday}
                        onChange={
                          permissions.canEdit
                            ? async (e) => {
                                try {
                                  const newFollowUpValue = e.target.checked;

                                  // Optimistically update the UI before API call
                                  setData((prevData) =>
                                    prevData.map((item) =>
                                      item.id === row.id
                                        ? {
                                            ...item,
                                            followUpFriday: newFollowUpValue,
                                          }
                                        : item
                                    )
                                  );

                                  // Construct the updated data
                                  const updatedData = {
                                    updates: {
                                      followUpFriday: newFollowUpValue,
                                    },
                                  };

                                  // Send the API request
                                  await api.updateOpportunity(
                                    row.id,
                                    row,
                                    updatedData
                                  );
                                } catch (error) {
                                  setError(
                                    "Failed to update follow-up status."
                                  );

                                  // Revert UI update if API call fails
                                  setData((prevData) =>
                                    prevData.map((item) =>
                                      item.id === row.id
                                        ? {
                                            ...item,
                                            followUpFriday: !newFollowUpValue,
                                          }
                                        : item
                                    )
                                  );
                                }
                              }
                            : undefined
                        }
                        disabled={!permissions.canEdit}
                        className="relative z-10 h-4 w-4 rounded border-gray-300 bg-custom text-[#238636] focus:ring-[#238636]"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Section */}
      <div className="px-4 py-3 border border-custom bg-custom rounded-b-lg">
        <div className="flex justify-between items-center">
          {/* Left Side - Theme Toggle with icons */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    id="theme-toggle"
                    checked={theme === "light"}
                    onChange={toggleTheme}
                    className="sr-only"
                  />
                  <label
                    htmlFor="theme-toggle"
                    className={`flex items-center w-14 h-7 rounded-full transition-colors duration-300 cursor-pointer ${
                      theme === "dark" ? "bg-gray-700" : "bg-blue-500"
                    }`}
                  >
                    <div
                      className={`absolute h-5 w-5 rounded-full transition-transform duration-300 flex items-center justify-center ${
                        theme === "dark"
                          ? "translate-x-1.5 bg-gray-900"
                          : "translate-x-7 bg-white"
                      }`}
                    >
                      {theme === "dark" ? (
                        <Moon className="h-3 w-3 text-white" />
                      ) : (
                        <Sun className="h-3 w-3 text-yellow-500" />
                      )}
                    </div>
                  </label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {theme === "dark"
                    ? "Switch to Light Mode"
                    : "Switch to Dark Mode"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Center - Empty Space */}
          <div className="flex-1"></div>

          {/* Right Side - Records Per Page and Pagination Controls */}
          <div className="flex items-center space-x-4">
            <Select
              className="min-w-[6rem] bg-custom text-custom border-custom rounded-md"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={100}>100</option>
              <option value={50}>50</option>
              <option value={20}>20</option>
              <option value={10}>10</option>
            </Select>

            <button
              className="btn-pages"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              {"<<"}
            </button>
            <button
              className="btn-pages"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              {"<"}
            </button>
            <span className="text-custom whitespace-nowrap">
              ({currentPage} of {totalPages})
            </span>
            <button
              className="btn-pages"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              {">"}
            </button>
            <button
              className="btn-pages"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              {">>"}
            </button>
          </div>
        </div>
      </div>

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        data={editingData}
        uniquePipelineStages={uniquePipelineStages}
        uniqueStages={uniqueStages}
        onSave={handleSave}
      />

      <ViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        data={viewingData}
        onEdit={
          permissions.canEdit
            ? (data) => {
                setEditingData(data);
                setIsEditModalOpen(true);
              }
            : undefined
        }
        showEditButton={permissions.canEdit}
      />
    </div>
  );
};

export default LoanDashboard;
