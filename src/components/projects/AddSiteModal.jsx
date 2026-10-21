import React, { useState } from 'react';
import { projectApi } from '../../api/projectApi';
import { useToast } from '../../context/ToastContext';
import {
  X,
  MapPin,
  ShieldAlert,
  Phone,
  HardHat,
  Compass,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

export const AddSiteModal = ({
  isOpen,
  onClose,
  projectId,
  projectCode,
  projectName,
  employees = [],
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Indore');
  const [state, setState] = useState('Madhya Pradesh');
  const [pincode, setPincode] = useState('452001');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [safetyInstructions, setSafetyInstructions] = useState(
    'PPE mandatory at all times (Helmet, High-Vis Jacket, Steel-toe safety shoes). Excavation areas must be barricaded.'
  );
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(6));
          setLongitude(position.coords.longitude.toFixed(6));
          showToast('GPS coordinates captured from browser location', 'success');
        },
        (error) => {
          showToast('Unable to fetch device GPS: ' + error.message, 'warning');
        }
      );
    } else {
      showToast('Geolocation is not supported by your browser', 'warning');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Site name is required', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        siteName: name.trim(),
        name: name.trim(),
        siteAddress: {
          street: street.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          pincode: pincode.trim() || undefined,
          country: 'India',
        },
        address: {
          street: street.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          pincode: pincode.trim() || undefined,
          country: 'India',
        },
        assignedSupervisor: supervisorId || undefined,
        supervisor: supervisorId || undefined,
        safetyInstructions: safetyInstructions.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      if (latitude && longitude) {
        payload.coordinates = {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        };
        payload.locationCoordinates = {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        };
      }

      if (emergencyName.trim() && emergencyPhone.trim()) {
        payload.emergencyContact = {
          name: emergencyName.trim(),
          phone: emergencyPhone.trim(),
        };
      }

      const res = await projectApi.createSite(projectId, payload);
      showToast(res.message || 'Child site created successfully', 'success');
      onSuccess?.(res.data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create site';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-amber-500/10 text-slate-100 p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-['Outfit'] tracking-wide">
                Add Construction Child Site
              </h2>
              <p className="text-xs text-slate-400">
                {projectCode ? (
                  <span className="font-mono text-amber-400 font-semibold mr-1.5">
                    [{projectCode}]
                  </span>
                ) : null}
                {projectName || 'Parent Construction Project'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Site Name */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Site / Sub-Unit Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tower A - Substructure & Foundation, Main Clubhouse, Gate 1 Mobilization"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          {/* Supervisor Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Designated Site Supervisor
            </label>
            <div className="relative">
              <select
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 appearance-none"
              >
                <option value="">-- Unassigned / Assign Later --</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.employeeId} - {emp.fullName || `${emp.name?.firstName} ${emp.name?.lastName}`} ({emp.designation})
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-2.5 pointer-events-none text-slate-500">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
            <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Site Physical Address
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-500 mb-1">Street Address</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Plot / Sector / Road"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">PIN Code</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="452xxx"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* GPS Coordinates */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  GPS Geolocation (Lat / Long)
                </label>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold underline"
                >
                  Fetch Device GPS
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Latitude (e.g. 22.719568)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                />
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Longitude (e.g. 75.857727)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Safety & Emergency Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Safety & Compliance Directives
              </label>
              <textarea
                rows={3}
                value={safetyInstructions}
                onChange={(e) => setSafetyInstructions(e.target.value)}
                placeholder="Hard hats, harness requirements, barricading rules..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-400 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                Site Emergency Contact
              </label>
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="Contact Person (e.g. Site Safety Officer)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
              <input
                type="text"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="Emergency 10-digit Phone"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>Creating Site...</>
              ) : (
                <>
                  <span>Create Site Unit</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
