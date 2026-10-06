"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Home,
  MapPin,
  SquareStack,
  BedDouble,
  Bath,
  Car,
  Sofa,
  Sparkles,
  Send,
  Save,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Plus,
  Trash2,
  Compass,
  Video,
  FileText,
  ShieldCheck,
  Zap,
  Droplets,
  Truck,
  Store,
  Briefcase,
  Trees,
  Warehouse,
  Layers,
  HelpCircle,
  Upload,
  Camera,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  TYPE_AMENITIES,
  PropertyTypeCode,
  validatePropertyTypeForm,
} from "@/lib/property-type-specs";
import { getPropertyTypeLabel } from "@/lib/utils";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

function mapCategoryToPropertyType(name: string, slug?: string): PropertyTypeCode {
  const s = `${slug || ""} ${name}`.toLowerCase();
  if (s.includes("apartment") || s.includes("flat") || s.includes("condo") || s.includes("penthouse")) return "APARTMENT";
  if (s.includes("villa") || s.includes("estate") || s.includes("mansion")) return "VILLA";
  if (s.includes("land") || s.includes("plot") || s.includes("farm") || s.includes("acre")) return "LAND";
  if (s.includes("office")) return "OFFICE";
  if (s.includes("warehouse") || s.includes("depot") || s.includes("storage") || s.includes("industrial") || s.includes("logistics")) return "WAREHOUSE";
  if (s.includes("shop") || s.includes("retail") || s.includes("store") || s.includes("mall")) return "SHOP";
  if (s.includes("commercial") || s.includes("business") || s.includes("plaza")) return "COMMERCIAL";
  if (s.includes("townhouse")) return "HOUSE";
  if (s.includes("studio")) return "APARTMENT";
  if (s.includes("house") || s.includes("home") || s.includes("residential")) return "HOUSE";
  return "OTHER";
}

function getCategoryBadge(name: string, slug?: string): string {
  const s = `${slug || ""} ${name}`.toLowerCase();
  if (s.includes("commercial") || s.includes("office") || s.includes("business") || s.includes("retail") || s.includes("shop")) return "COMMERCIAL";
  if (s.includes("land") || s.includes("plot") || s.includes("acre") || s.includes("farm")) return "LAND";
  if (s.includes("industrial") || s.includes("warehouse") || s.includes("depot")) return "INDUSTRIAL";
  return "RESIDENTIAL";
}

interface DynamicPropertyFormProps {
  initialData?: any;
  onSuccessRedirect?: string;
  isAdminMode?: boolean;
}

export default function DynamicPropertyForm({
  initialData,
  onSuccessRedirect = "/dashboard/properties",
  isAdminMode = false,
}: DynamicPropertyFormProps) {
  const router = useRouter();

  // Wizard Step (1: Type, 2: Basic, 3: Specs, 4: Media, 5: Review)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [dupWarning, setDupWarning] = useState<string | null>(null);
  const [anomalyWarning, setAnomalyWarning] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Media Upload States
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingFloorPlan, setUploadingFloorPlan] = useState(false);
  const [showCoverUrlInput, setShowCoverUrlInput] = useState(false);
  const [showGalleryUrlInput, setShowGalleryUrlInput] = useState(false);

  // Registered Categories and Cities from Database
  const [registeredCategories, setRegisteredCategories] = useState<CategoryOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("");
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, locRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/locations"),
        ]);
        const catData = await catRes.json();
        const locData = await locRes.json();

        if (catData.success && Array.isArray(catData.categories)) {
          setRegisteredCategories(catData.categories);

          if (catData.categories.length > 0) {
            let matchedCat: CategoryOption | undefined;
            if (initialData?.typeDetails) {
              try {
                const details =
                  typeof initialData.typeDetails === "string"
                    ? JSON.parse(initialData.typeDetails)
                    : initialData.typeDetails;
                if (details?.categoryId) {
                  matchedCat = catData.categories.find(
                    (c: CategoryOption) => c.id === details.categoryId
                  );
                }
                if (!matchedCat && details?.categoryName) {
                  matchedCat = catData.categories.find(
                    (c: CategoryOption) =>
                      c.name.toLowerCase() === details.categoryName.toLowerCase()
                  );
                }
              } catch {}
            }
            if (!matchedCat && initialData?.type) {
              matchedCat = catData.categories.find(
                (c: CategoryOption) =>
                  mapCategoryToPropertyType(c.name, c.slug) === initialData.type
              );
            }
            if (!matchedCat && !initialData?.id) {
              matchedCat = catData.categories[0];
            }

            if (matchedCat) {
              setSelectedCategoryId(matchedCat.id);
              setSelectedCategoryName(matchedCat.name);
              const mappedType = mapCategoryToPropertyType(matchedCat.name, matchedCat.slug);
              if (!initialData?.type) {
                handleTypeChange(mappedType);
              }
            }
          }
        }

        if (locData.success && Array.isArray(locData.cities)) {
          setCities(locData.cities);
          if (locData.cities.length > 0) {
            setCommon((prev) => {
              if (!prev.city || !locData.cities.includes(prev.city)) {
                return { ...prev, city: locData.cities[0] };
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.error("Failed to load registered categories or locations", err);
      } finally {
        setLoadingCategories(false);
        setLoadingCities(false);
      }
    }
    loadData();
  }, [initialData]);

  const handleCategorySelect = (cat: CategoryOption) => {
    setSelectedCategoryId(cat.id);
    setSelectedCategoryName(cat.name);
    const mappedType = mapCategoryToPropertyType(cat.name, cat.slug);
    handleTypeChange(mappedType);
  };

  // Form State
  const [selectedType, setSelectedType] = useState<PropertyTypeCode>(
    (initialData?.type as PropertyTypeCode) || "HOUSE"
  );
  const [listingType, setListingType] = useState<"FOR_SALE" | "FOR_RENT">(
    initialData?.listingType || "FOR_SALE"
  );

  // Common Fields
  const [common, setCommon] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    price: initialData?.price ? String(initialData.price) : "",
    city: initialData?.city || "Mogadishu",
    location: initialData?.location || "",
    address: initialData?.address || "",
    latitude: initialData?.latitude ? String(initialData.latitude) : "",
    longitude: initialData?.longitude ? String(initialData.longitude) : "",
    rentPeriod: initialData?.rentPeriod || "MONTHLY",
    securityDeposit: initialData?.securityDeposit ? String(initialData.securityDeposit) : "",
    isNegotiable: Boolean(initialData?.isNegotiable),
    area: initialData?.area ? String(initialData.area) : "",
    bedrooms: initialData?.bedrooms ? String(initialData.bedrooms) : "3",
    bathrooms: initialData?.bathrooms ? String(initialData.bathrooms) : "2",
    parking: initialData?.parking ? String(initialData.parking) : "1",
    lotSize: initialData?.lotSize ? String(initialData.lotSize) : "",
    yearBuilt: initialData?.yearBuilt ? String(initialData.yearBuilt) : "",
    isFurnished: Boolean(initialData?.isFurnished),
  });

  // Media Fields
  const [media, setMedia] = useState({
    imageUrl:
      initialData?.images?.[0]?.url ||
      initialData?.imageUrl ||
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
    videoUrl: initialData?.videoUrl || "",
    floorPlanUrl: initialData?.floorPlanUrl || "",
    virtualTourUrl: initialData?.virtualTourUrl || "",
  });

  // Gallery Images List
  const [galleryImages, setGalleryImages] = useState<string[]>(
    initialData?.images?.slice(1)?.map((img: any) => img.url) || []
  );
  const [newGalleryUrl, setNewGalleryUrl] = useState("");

  // Selected Amenities List
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(() => {
    if (initialData?.amenities) {
      try {
        const parsed = JSON.parse(initialData.amenities);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return TYPE_AMENITIES[selectedType]?.slice(0, 5) || [];
  });

  // Type-Specific Details State (JSON structure)
  const [typeDetails, setTypeDetails] = useState<Record<string, any>>(() => {
    if (initialData?.typeDetails) {
      try {
        return typeof initialData.typeDetails === "string"
          ? JSON.parse(initialData.typeDetails)
          : initialData.typeDetails;
      } catch {
        return {};
      }
    }
    return {};
  });

  // Sync state if initialData is passed or updated
  useEffect(() => {
    if (initialData) {
      if (initialData.type) setSelectedType(initialData.type as PropertyTypeCode);
      if (initialData.listingType) setListingType(initialData.listingType);
      setCommon({
        title: initialData.title || "",
        description: initialData.description || "",
        price: initialData.price !== undefined ? String(initialData.price) : "",
        city: initialData.city || "Mogadishu",
        location: initialData.location || "",
        address: initialData.address || "",
        latitude: initialData.latitude !== undefined && initialData.latitude !== null ? String(initialData.latitude) : "",
        longitude: initialData.longitude !== undefined && initialData.longitude !== null ? String(initialData.longitude) : "",
        rentPeriod: initialData.rentPeriod || "MONTHLY",
        securityDeposit: initialData.securityDeposit !== undefined && initialData.securityDeposit !== null ? String(initialData.securityDeposit) : "",
        isNegotiable: Boolean(initialData.isNegotiable),
        area: initialData.area !== undefined ? String(initialData.area) : "",
        bedrooms: initialData.bedrooms !== undefined ? String(initialData.bedrooms) : "3",
        bathrooms: initialData.bathrooms !== undefined ? String(initialData.bathrooms) : "2",
        parking: initialData.parking !== undefined ? String(initialData.parking) : "1",
        lotSize: initialData.lotSize !== undefined && initialData.lotSize !== null ? String(initialData.lotSize) : "",
        yearBuilt: initialData.yearBuilt !== undefined && initialData.yearBuilt !== null ? String(initialData.yearBuilt) : "",
        isFurnished: Boolean(initialData.isFurnished),
      });

      if (initialData.images && initialData.images.length > 0) {
        setMedia({
          imageUrl: initialData.images[0]?.url || initialData.imageUrl || "",
          videoUrl: initialData.videoUrl || "",
          floorPlanUrl: initialData.floorPlanUrl || "",
          virtualTourUrl: initialData.virtualTourUrl || "",
        });
        setGalleryImages(initialData.images.slice(1).map((img: any) => img.url));
      } else if (initialData.imageUrl) {
        setMedia((prev) => ({ ...prev, imageUrl: initialData.imageUrl }));
      }

      if (initialData.amenities) {
        try {
          const parsed = typeof initialData.amenities === "string" ? JSON.parse(initialData.amenities) : initialData.amenities;
          if (Array.isArray(parsed)) setSelectedAmenities(parsed);
        } catch {}
      }

      if (initialData.typeDetails) {
        try {
          const parsed = typeof initialData.typeDetails === "string" ? JSON.parse(initialData.typeDetails) : initialData.typeDetails;
          if (parsed && typeof parsed === "object") {
            setTypeDetails(parsed);
            if (parsed.categoryId) setSelectedCategoryId(parsed.categoryId);
            if (parsed.categoryName) setSelectedCategoryName(parsed.categoryName);
          }
        } catch {}
      }
    }
  }, [initialData]);

  // Reset or initialize type-specific fields when Property Type changes
  const handleTypeChange = (newType: PropertyTypeCode) => {
    setSelectedType(newType);

    // Initialize clean type-specific details
    let defaultDetails: Record<string, any> = {};
    if (newType === "LAND") {
      defaultDetails = {
        landArea: common.area || "500",
        landUse: "Residential",
        roadAccess: true,
        roadWidth: "12",
        ownershipType: "Freehold",
        titleDeedStatus: "Registered Title Deed",
        waterAvailability: "Available",
        electricityAvailability: "Available",
        boundary: "Marked Boundary",
        isCornerPlot: false,
        developmentStatus: "Ready for Construction",
        zoning: "Residential R-2",
      };
      setCommon((prev) => ({ ...prev, bedrooms: "0", bathrooms: "0", isFurnished: false, parking: "0" }));
    } else if (newType === "APARTMENT") {
      defaultDetails = {
        floorNumber: "3",
        totalFloors: "6",
        hasBalcony: true,
        hasElevator: true,
        livingRooms: "1",
      };
      setCommon((prev) => ({ ...prev, bedrooms: prev.bedrooms === "0" ? "2" : prev.bedrooms, bathrooms: "2" }));
    } else if (newType === "VILLA") {
      defaultDetails = {
        compoundSize: "600",
        floors: "2",
        hasPool: false,
        hasMaidRoom: true,
        hasGuestRoom: true,
        livingRooms: "2",
      };
      setCommon((prev) => ({ ...prev, bedrooms: prev.bedrooms === "0" ? "4" : prev.bedrooms, bathrooms: "4" }));
    } else if (newType === "OFFICE" || newType === "COMMERCIAL") {
      defaultDetails = {
        floorArea: common.area || "200",
        commercialType: "Corporate Office",
        floors: "1",
        meetingRooms: "2",
        reception: true,
        suitableBusiness: "Corporate / Professional Services",
        fitoutStatus: "Fully Fitted",
      };
      setCommon((prev) => ({ ...prev, bedrooms: "0", bathrooms: "2" }));
    } else if (newType === "SHOP") {
      defaultDetails = {
        shopArea: common.area || "65",
        floorLevel: "Ground Floor",
        frontageWidth: "6",
        storageArea: "15",
        suitableBusiness: "Retail / Fashion / Electronics",
      };
      setCommon((prev) => ({ ...prev, bedrooms: "0", bathrooms: "1" }));
    } else if (newType === "WAREHOUSE") {
      defaultDetails = {
        warehouseArea: common.area || "800",
        compoundSize: "1500",
        ceilingHeight: "9",
        storageCapacity: "1,200 Pallets",
        loadingBays: "2 Dock Levelers",
        truckAccess: "Full Trailer Access",
        officeArea: "80",
      };
      setCommon((prev) => ({ ...prev, bedrooms: "0", bathrooms: "2" }));
    }

    setTypeDetails(defaultDetails);
    // Update default amenities for new type
    setSelectedAmenities(TYPE_AMENITIES[newType]?.slice(0, 6) || []);
    setValidationErrors({});
  };

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleAddGalleryImage = () => {
    const url = newGalleryUrl.trim();
    if (!url) {
      toast({ title: "No URL", description: "Please paste an image URL first.", variant: "destructive" });
      return;
    }
    // Basic URL validation
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      toast({ title: "Invalid URL", description: "Image URL must start with http:// or https://", variant: "destructive" });
      return;
    }
    setGalleryImages((prev) => [...prev, url]);
    setNewGalleryUrl("");
    toast({ title: "Image Added ✓", description: `Gallery image ${galleryImages.length + 1} added successfully.` });
  };

  const handleRemoveGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload Cover Image from Device
  const handleUploadCover = async (file: File) => {
    if (!file) return;
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setMedia((p) => ({ ...p, imageUrl: data.url }));
        setValidationErrors((p) => {
          const next = { ...p };
          delete next.imageUrl;
          return next;
        });
        toast({ title: "Cover Image Uploaded! 📸", description: "Primary photo set successfully." });
      } else {
        toast({ title: "Upload Failed", description: data.error || "Failed to upload cover image.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Upload Error", description: "Network error during upload.", variant: "destructive" });
    } finally {
      setUploadingCover(false);
    }
  };

  // Upload Multiple Gallery Photos from Device
  const handleUploadGallery = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setUploadingGallery(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("files", f));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.urls) && data.urls.length > 0) {
        setGalleryImages((prev) => [...prev, ...data.urls]);
        toast({
          title: "Photos Uploaded! 🖼️",
          description: `Added ${data.urls.length} photo${data.urls.length > 1 ? "s" : ""} to property gallery.`,
        });
      } else if (data.success && data.url) {
        setGalleryImages((prev) => [...prev, data.url]);
        toast({ title: "Photo Uploaded! 🖼️", description: "Added 1 photo to property gallery." });
      } else {
        toast({ title: "Upload Failed", description: data.error || "Failed to upload gallery photos.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Upload Error", description: "Network error during upload.", variant: "destructive" });
    } finally {
      setUploadingGallery(false);
    }
  };

  // Upload Floor Plan
  const handleUploadFloorPlan = async (file: File) => {
    if (!file) return;
    setUploadingFloorPlan(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setMedia((p) => ({ ...p, floorPlanUrl: data.url }));
        toast({ title: "Floor Plan Uploaded! 📐", description: "Floor plan attached successfully." });
      } else {
        toast({ title: "Upload Failed", description: data.error || "Failed to upload floor plan.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Upload Error", description: "Network error during upload.", variant: "destructive" });
    } finally {
      setUploadingFloorPlan(false);
    }
  };

  // Upload Video Tour from Device
  const handleUploadVideo = async (file: File) => {
    if (!file) return;
    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setMedia((p) => ({ ...p, videoUrl: data.url }));
        toast({ title: "Video Uploaded! 🎥", description: "Video tour attached successfully." });
      } else {
        toast({ title: "Upload Failed", description: data.error || "Failed to upload video.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Upload Error", description: "Network error during video upload.", variant: "destructive" });
    } finally {
      setUploadingVideo(false);
    }
  };

  // AI Description Generator
  const handleGenerateAiDescription = async () => {
    setGeneratingDesc(true);
    try {
      const res = await fetch("/api/properties/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: common.title || `${selectedType} in ${common.city}`,
          city: common.city,
          type: selectedType,
          bedrooms: Number(common.bedrooms) || 0,
          bathrooms: Number(common.bathrooms) || 0,
          area: Number(common.area || typeDetails.landArea || typeDetails.shopArea || 100),
          amenities: selectedAmenities,
        }),
      });
      const data = await res.json();
      if (data.success && data.description) {
        setCommon((prev) => ({ ...prev, description: data.description }));
        toast({
          title: "AI Description Generated! ✨",
          description: "Listing text generated. You can review and personalize it.",
        });
      }
    } catch {
      toast({
        title: "Notice",
        description: "Could not generate AI description. You can write your own description.",
      });
    } finally {
      setGeneratingDesc(false);
    }
  };

  // Check Duplicates / Anomalies
  const handleDuplicateCheck = async () => {
    if (!common.title || !common.price || !common.city) return;
    try {
      const res = await fetch("/api/properties/duplicate-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: common.title,
          city: common.city,
          price: Number(common.price),
          bedrooms: Number(common.bedrooms) || 0,
          area: Number(common.area || typeDetails.landArea || 100),
          type: selectedType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.duplicate?.isDuplicate) {
          setDupWarning(
            `⚠️ Notice: A similar listing "${data.duplicate.matchedProperty?.title}" ($${data.duplicate.matchedProperty?.price}) is already registered.`
          );
        } else {
          setDupWarning(null);
        }
        if (data.anomaly?.isAnomaly) {
          setAnomalyWarning(`💡 AI Market Position: ${data.anomaly.reason}`);
        } else {
          setAnomalyWarning(null);
        }
      }
    } catch {
      // Non-blocking
    }
  };

  // Validation before step transition
  const validateStep = (stepNumber: number): boolean => {
    const { isValid, errors } = validatePropertyTypeForm(selectedType, {
      title: common.title,
      price: common.price,
      city: common.city,
      description: common.description,
      area: common.area || typeDetails.landArea || typeDetails.shopArea || typeDetails.warehouseArea || typeDetails.floorArea,
      bedrooms: common.bedrooms,
      bathrooms: common.bathrooms,
      imageUrl: media.imageUrl,
      typeDetails,
    });

    if (stepNumber === 1) {
      if (registeredCategories.length > 0 && !selectedCategoryId && !selectedCategoryName) {
        toast({
          title: "Selection Required",
          description: "Please select a registered property classification to proceed.",
          variant: "destructive",
        });
        return false;
      }
    }

    if (stepNumber === 2) {
      const step2Errors: Record<string, string> = {};
      if (errors.title) step2Errors.title = errors.title;
      if (errors.price) step2Errors.price = errors.price;
      if (errors.city) step2Errors.city = errors.city;
      if (errors.description) step2Errors.description = errors.description;
      if (Object.keys(step2Errors).length > 0) {
        setValidationErrors(step2Errors);
        toast({ title: "Incomplete Details", description: "Please complete required basic fields.", variant: "destructive" });
        return false;
      }
    }

    if (stepNumber === 3) {
      const step3Errors: Record<string, string> = { ...errors };
      delete step3Errors.title;
      delete step3Errors.price;
      delete step3Errors.city;
      delete step3Errors.description;
      delete step3Errors.imageUrl;

      if (Object.keys(step3Errors).length > 0) {
        setValidationErrors(step3Errors);
        toast({ title: "Specifications Required", description: "Please provide the required specifications for this property type.", variant: "destructive" });
        return false;
      }
    }

    if (stepNumber === 4) {
      if (errors.imageUrl) {
        setValidationErrors({ imageUrl: errors.imageUrl });
        toast({ title: "Primary Image Required", description: errors.imageUrl, variant: "destructive" });
        return false;
      }
    }

    setValidationErrors({});
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(5, prev + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Final Form Submission
  const handleSubmit = async (submitForReview: boolean) => {
    // Comprehensive validation
    const { isValid, errors } = validatePropertyTypeForm(selectedType, {
      title: common.title,
      price: common.price,
      city: common.city,
      description: common.description,
      area: common.area || typeDetails.landArea || typeDetails.shopArea || typeDetails.warehouseArea || typeDetails.floorArea,
      bedrooms: common.bedrooms,
      bathrooms: common.bathrooms,
      imageUrl: media.imageUrl,
      typeDetails,
    });

    if (!isValid) {
      setValidationErrors(errors);
      toast({
        title: "Validation Incomplete",
        description: Object.values(errors)[0] || "Please check all required fields.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(submitForReview ? "PENDING" : "DRAFT");
    try {
      const payload = {
        title: common.title,
        description: common.description,
        price: Number(common.price),
        city: common.city,
        location: common.location || common.city,
        address: common.address || null,
        latitude: common.latitude ? Number(common.latitude) : null,
        longitude: common.longitude ? Number(common.longitude) : null,
        type: selectedType,
        listingType,
        isNegotiable: listingType === "FOR_SALE" ? common.isNegotiable : false,
        rentPeriod: listingType === "FOR_RENT" ? common.rentPeriod : null,
        securityDeposit: listingType === "FOR_RENT" && common.securityDeposit ? Number(common.securityDeposit) : null,
        bedrooms: ["LAND", "SHOP", "WAREHOUSE", "OFFICE", "COMMERCIAL"].includes(selectedType)
          ? 0
          : Number(common.bedrooms) || 0,
        bathrooms: selectedType === "LAND" ? 0 : Number(common.bathrooms) || 0,
        area: Number(
          common.area ||
            typeDetails.landArea ||
            typeDetails.shopArea ||
            typeDetails.warehouseArea ||
            typeDetails.floorArea ||
            100
        ),
        parking: Number(common.parking) || 0,
        lotSize: common.lotSize ? Number(common.lotSize) : typeDetails.compoundSize ? Number(typeDetails.compoundSize) : null,
        yearBuilt: common.yearBuilt ? Number(common.yearBuilt) : null,
        isFurnished: Boolean(common.isFurnished),
        imageUrl: media.imageUrl,
        galleryImages,
        videoUrl: media.videoUrl || null,
        floorPlanUrl: media.floorPlanUrl || null,
        virtualTourUrl: media.virtualTourUrl || null,
        amenities: selectedAmenities,
        typeDetails: {
          ...typeDetails,
          categoryId: selectedCategoryId,
          categoryName: selectedCategoryName,
        },
        submitForReview,
      };

      const isEditing = Boolean(initialData?.id);
      const url = isEditing ? `/api/properties/${initialData.id}` : "/api/properties";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: isEditing
            ? "Property Updated! ✨"
            : submitForReview
            ? "Submitted for Admin Review! 🚀"
            : "Saved as Draft 📝",
          description: isEditing
            ? `Listing "${common.title}" details have been updated successfully.`
            : submitForReview
            ? "Your listing has been submitted and queued for verification."
            : "Property successfully saved as a draft.",
        });

        // In Admin Mode, if admin created a new property, auto-approve
        if (!isEditing && isAdminMode && data.property?.id) {
          await fetch(`/api/admin/properties/${data.property.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "APPROVED" }),
          }).catch(() => {});
        }

        router.push(onSuccessRedirect);
        router.refresh();
      } else {
        toast({
          title: "Submission Failed",
          description: data.error || "Please verify the form inputs.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Network Error",
        description: "Failed to connect to the server. Please retry.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(null);
    }
  };

  const steps = [
    { number: 1, label: "Property Type", icon: Building2 },
    { number: 2, label: "Basic Info", icon: MapPin },
    { number: 3, label: "Type Specs", icon: Layers },
    { number: 4, label: "Media & Tour", icon: ImageIcon },
    { number: 5, label: "Review & Submit", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto bg-[#F7F3EA] pb-12">
      {/* ── Wizard Progress Bar ── */}
      <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-5 gap-2">
          {steps.map((st) => {
            const Icon = st.icon;
            const isCompleted = currentStep > st.number;
            const isCurrent = currentStep === st.number;
            return (
              <button
                key={st.number}
                type="button"
                onClick={() => {
                  if (st.number < currentStep || validateStep(currentStep)) {
                    setCurrentStep(st.number);
                  }
                }}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 p-2 rounded-2xl transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-[#07111F] text-[#D9B45B] shadow-sm"
                    : isCompleted
                    ? "bg-[#C89B3C]/15 text-[#07111F] hover:bg-[#C89B3C]/25"
                    : "text-[#6B7280] opacity-60"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCurrent
                      ? "bg-[#C89B3C] text-[#07111F]"
                      : isCompleted
                      ? "bg-[#07111F] text-[#FCFBF7]"
                      : "bg-[#E8E1D4] text-[#6B7280]"
                  }`}
                >
                  {isCompleted ? "✓" : st.number}
                </div>
                <span className="text-[11px] font-bold tracking-tight text-center hidden sm:inline">
                  {st.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {dupWarning && (
        <div className="bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] p-4 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{dupWarning}</span>
        </div>
      )}

      {anomalyWarning && (
        <div className="bg-[#ECFEFF] border border-[#A5F3FC] text-[#0891B2] p-4 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>{anomalyWarning}</span>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          STEP 1: SELECT PROPERTY TYPE (DYNAMIC SELECTION)
         ════════════════════════════════════════════════════════ */}
      {currentStep === 1 && (
        <div className="bg-[#FCFBF7] rounded-3xl shadow-sm border border-[#E8E1D4] p-6 sm:p-8 space-y-6">
          <div className="border-b border-[#E8E1D4] pb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#07111F] text-[#D9B45B] text-[10px] font-bold uppercase tracking-wider mb-2">
              Step 1 of 5
            </span>
            <h2 className="text-2xl font-serif font-black text-[#07111F]">
              Select Property Classification
            </h2>
            <p className="text-xs text-[#6B7280] mt-1">
              Choose the category of property you are listing. The registration form will adapt dynamically to display only relevant fields.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {loadingCategories ? (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-[#6B7280] space-y-2">
                <Loader2 className="h-6 w-6 animate-spin text-[#C89B3C]" />
                <span className="text-xs font-semibold">Loading registered categories...</span>
              </div>
            ) : registeredCategories.length === 0 ? (
              <div className="col-span-full py-12 text-center text-[#6B7280] space-y-2 bg-[#F7F3EA] rounded-2xl border border-[#E8E1D4] p-6">
                <AlertCircle className="h-8 w-8 text-[#C89B3C] mx-auto" />
                <p className="text-sm font-bold text-[#07111F]">No Property Categories Registered</p>
                <p className="text-xs">
                  Please register property classifications in Admin &gt; Categories first.
                </p>
              </div>
            ) : (
              registeredCategories.map((cat) => {
                const isSelected =
                  selectedCategoryId === cat.id ||
                  (!selectedCategoryId && selectedCategoryName === cat.name);
                const badge = getCategoryBadge(cat.name, cat.slug);

                return (
                  <div
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 text-left relative ${
                      isSelected
                        ? "border-[#C89B3C] bg-[#C89B3C]/10 shadow-sm ring-2 ring-[#C89B3C]/20"
                        : "border-[#E8E1D4] bg-[#FCFBF7] hover:border-[#C89B3C]/50 hover:bg-[#F7F3EA]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#07111F] text-[#D9B45B]">
                          {badge}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-[#C89B3C] fill-[#C89B3C] text-white" />
                        )}
                      </div>
                      <h3 className="font-serif font-bold text-base text-[#07111F]">
                        {cat.name}
                      </h3>
                      <p className="text-[11px] text-[#6B7280] mt-1 line-clamp-2">
                        {cat.description || "Registered property classification category"}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#E8E1D4]/60 flex items-center justify-between text-[11px] font-bold text-[#A97918]">
                      <span>{isSelected ? "Selected ✓" : "Select Category"}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-4 border-t border-[#E8E1D4] flex items-center justify-between">
            <p className="text-xs text-[#6B7280]">
              Currently Selected:{" "}
              <strong className="text-[#07111F]">
                {selectedCategoryName || getPropertyTypeLabel(selectedType)}
              </strong>
            </p>
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={loadingCategories || registeredCategories.length === 0}
              className="gap-2 bg-[#07111F] hover:bg-[#07111F]/90 text-[#FCFBF7] font-bold rounded-xl px-6 h-11 cursor-pointer disabled:opacity-50"
            >
              Continue to Basic Details <ArrowRight className="h-4 w-4 text-[#D9B45B]" />
            </Button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          STEP 2: COMMON PROPERTY INFORMATION
         ════════════════════════════════════════════════════════ */}
      {currentStep === 2 && (
        <div className="bg-[#FCFBF7] rounded-3xl shadow-sm border border-[#E8E1D4] p-6 sm:p-8 space-y-6">
          <div className="border-b border-[#E8E1D4] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#07111F] text-[#D9B45B] text-[10px] font-bold uppercase tracking-wider mb-2">
                Step 2 of 5 • {selectedCategoryName || getPropertyTypeLabel(selectedType)}
              </span>
              <h2 className="text-2xl font-serif font-black text-[#07111F]">
                Common Property Information
              </h2>
              <p className="text-xs text-[#6B7280] mt-1">
                Provide essential pricing, identification, and spatial location details.
              </p>
            </div>

            {/* Listing Type Toggle (For Sale vs For Rent) */}
            <div className="flex items-center p-1 bg-[#F7F3EA] rounded-2xl border border-[#E8E1D4] self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setListingType("FOR_SALE")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  listingType === "FOR_SALE"
                    ? "bg-[#07111F] text-[#FCFBF7] shadow-xs"
                    : "text-[#6B7280] hover:text-[#07111F]"
                }`}
              >
                For Sale
              </button>
              <button
                type="button"
                onClick={() => setListingType("FOR_RENT")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  listingType === "FOR_RENT"
                    ? "bg-[#07111F] text-[#FCFBF7] shadow-xs"
                    : "text-[#6B7280] hover:text-[#07111F]"
                }`}
              >
                For Rent
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Property Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-[#07111F]">
                  Property Title <span className="text-[#C89B3C]">*</span>
                </Label>
                {validationErrors.title && (
                  <span className="text-[11px] text-red-600 font-semibold">{validationErrors.title}</span>
                )}
              </div>
              <Input
                name="title"
                value={common.title}
                onChange={(e) => setCommon((p) => ({ ...p, title: e.target.value }))}
                onBlur={handleDuplicateCheck}
                placeholder={
                  selectedType === "LAND"
                    ? "e.g. 500m² Prime Residential Corner Plot in Wadajir"
                    : selectedType === "SHOP"
                    ? "e.g. Premium Commercial Retail Shop in Bakara Market"
                    : selectedType === "WAREHOUSE"
                    ? "e.g. 1,000m² High-Ceiling Logistics Warehouse in Industrial Zone"
                    : "e.g. Luxurious 3-Bedroom Executive Villa with Garden"
                }
                className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
                required
              />
            </div>

            {/* Listing Terms: dynamic by listing type */}
            {listingType === "FOR_RENT" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl border border-[#E8E1D4] bg-[#F7F3EA]">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Rent Period (price below is per period)</Label>
                  <Select
                    value={common.rentPeriod}
                    onValueChange={(val) => setCommon((p) => ({ ...p, rentPeriod: val }))}
                  >
                    <SelectTrigger className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="DAILY">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Security Deposit (USD, optional)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={common.securityDeposit}
                    onChange={(e) => setCommon((p) => ({ ...p, securityDeposit: e.target.value }))}
                    placeholder="500"
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
                  />
                </div>
              </div>
            ) : (
              <label className="flex items-center gap-2 text-xs font-semibold text-[#07111F] cursor-pointer">
                <input
                  type="checkbox"
                  checked={common.isNegotiable}
                  onChange={(e) => setCommon((p) => ({ ...p, isNegotiable: e.target.checked }))}
                  className="h-4 w-4 accent-[#C89B3C]"
                />
                Price is negotiable
              </label>
            )}

            {/* Price & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-[#07111F]">
                    {listingType === "FOR_RENT" ? `Rent per ${common.rentPeriod.toLowerCase().replace("ly", "").replace("dai", "day")} (USD)` : "Listing Price (USD)"} <span className="text-[#C89B3C]">*</span>
                  </Label>
                  {validationErrors.price && (
                    <span className="text-[11px] text-red-600 font-semibold">{validationErrors.price}</span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-sm font-bold text-[#C89B3C]">$</span>
                  <Input
                    name="price"
                    type="number"
                    value={common.price}
                    onChange={(e) => setCommon((p) => ({ ...p, price: e.target.value }))}
                    onBlur={handleDuplicateCheck}
                    placeholder="75000"
                    className="h-11 pl-7 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#07111F]">
                  Municipality / City <span className="text-[#C89B3C]">*</span>
                </Label>
                <Select
                  value={common.city}
                  onValueChange={(val) => setCommon((p) => ({ ...p, city: val }))}
                >
                  <SelectTrigger className="h-11 border-[#E8E1D4] rounded-xl bg-[#FCFBF7] text-[#07111F]">
                    <SelectValue placeholder={loadingCities ? "Loading registered cities..." : "Select city"} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FCFBF7] border-[#E8E1D4] max-h-60 overflow-y-auto">
                    {cities.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No registered cities available
                      </SelectItem>
                    ) : (
                      cities.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#07111F]">
                  District / Neighborhood
                </Label>
                <Input
                  name="location"
                  value={common.location}
                  onChange={(e) => setCommon((p) => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Hodan, Wadajir, Waberi"
                  className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#07111F]">Street Address / Specific Landmark</Label>
              <Input
                name="address"
                value={common.address}
                onChange={(e) => setCommon((p) => ({ ...p, address: e.target.value }))}
                placeholder="e.g. Near Maka Al-Mukarama Road, Opposite Central Mosque"
                className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
              />
            </div>

            {/* GPS Coordinates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#07111F] flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-[#C89B3C]" />
                  Latitude
                </Label>
                <Input
                  name="latitude"
                  type="number"
                  step="any"
                  value={common.latitude}
                  onChange={(e) => setCommon((p) => ({ ...p, latitude: e.target.value }))}
                  placeholder="e.g. 2.0469"
                  className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#07111F] flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-[#C89B3C]" />
                  Longitude
                </Label>
                <Input
                  name="longitude"
                  type="number"
                  step="any"
                  value={common.longitude}
                  onChange={(e) => setCommon((p) => ({ ...p, longitude: e.target.value }))}
                  placeholder="e.g. 45.3182"
                  className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Description & AI Generator */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-[#07111F]">
                  Property Description <span className="text-[#C89B3C]">*</span>
                </Label>
                <button
                  type="button"
                  onClick={handleGenerateAiDescription}
                  disabled={generatingDesc}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A97918] hover:text-[#C89B3C] bg-[#F7F3EA] border border-[#E8E1D4] px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  {generatingDesc ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-[#D9B45B]" />
                  )}
                  <span>AI Generate Description</span>
                </button>
              </div>
              <Textarea
                name="description"
                value={common.description}
                onChange={(e) => setCommon((p) => ({ ...p, description: e.target.value }))}
                placeholder="Detail key selling points, dimensions, surrounding neighborhood amenities, and road access..."
                className="min-h-[120px] border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
                required
              />
              {validationErrors.description && (
                <p className="text-[11px] text-red-600 font-semibold">{validationErrors.description}</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E8E1D4] flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              className="gap-2 border-[#E8E1D4] rounded-xl text-xs font-bold"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Type Selection
            </Button>
            <Button
              type="button"
              onClick={handleNextStep}
              className="gap-2 bg-[#07111F] hover:bg-[#07111F]/90 text-[#FCFBF7] font-bold rounded-xl px-6 h-11 cursor-pointer"
            >
              Continue to {selectedCategoryName || getPropertyTypeLabel(selectedType)} Specs <ArrowRight className="h-4 w-4 text-[#D9B45B]" />
            </Button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          STEP 3: PROPERTY-TYPE-SPECIFIC FIELDS & FEATURES
         ════════════════════════════════════════════════════════ */}
      {currentStep === 3 && (
        <div className="bg-[#FCFBF7] rounded-3xl shadow-sm border border-[#E8E1D4] p-6 sm:p-8 space-y-6">
          <div className="border-b border-[#E8E1D4] pb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#07111F] text-[#D9B45B] text-[10px] font-bold uppercase tracking-wider mb-2">
              Step 3 of 5 • Dynamic Specifications
            </span>
            <h2 className="text-2xl font-serif font-black text-[#07111F]">
              {selectedCategoryName || getPropertyTypeLabel(selectedType)} Detailed Specifications
            </h2>
            <p className="text-xs text-[#6B7280] mt-1">
              {selectedType === "LAND"
                ? "Provide plot dimensions, road access, title deed verification, and zoning status. Residential room counts are omitted."
                : `Enter specific spatial dimensions and structural features applicable to ${getPropertyTypeLabel(selectedType)}.`}
            </p>
          </div>

          {/* ──────────────────────────────────────────
              A. LAND SPECIFIC FORM
             ────────────────────────────────────────── */}
          {selectedType === "LAND" && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-[#C89B3C]/10 border border-[#C89B3C]/30 text-xs font-semibold text-[#07111F] flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#C89B3C] shrink-0" />
                <span>
                  <strong>Land Registration Mode Active:</strong> Room counts, living rooms, and furnished toggles are suppressed. Only spatial, legal, and utility parameters are recorded.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">
                    Land Area (m²) <span className="text-[#C89B3C]">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={typeDetails.landArea || common.area || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTypeDetails((p) => ({ ...p, landArea: val }));
                      setCommon((p) => ({ ...p, area: val }));
                    }}
                    placeholder="e.g. 500"
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm font-bold"
                    required
                  />
                  {validationErrors.landArea && (
                    <span className="text-[11px] text-red-600 font-semibold">{validationErrors.landArea}</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">
                    Land Use / Purpose <span className="text-[#C89B3C]">*</span>
                  </Label>
                  <Select
                    value={typeDetails.landUse || "Residential"}
                    onValueChange={(val) => setTypeDetails((p) => ({ ...p, landUse: val }))}
                  >
                    <SelectTrigger className="h-11 border-[#E8E1D4] rounded-xl bg-[#FCFBF7] text-[#07111F]">
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#FCFBF7] border-[#E8E1D4]">
                      <SelectItem value="Residential">Residential Construction</SelectItem>
                      <SelectItem value="Commercial">Commercial / Retail Hub</SelectItem>
                      <SelectItem value="Mixed Use">Mixed Use (Commercial + Residential)</SelectItem>
                      <SelectItem value="Industrial">Industrial / Warehouse Yard</SelectItem>
                      <SelectItem value="Agricultural">Agricultural / Farming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">
                    Plot Shape
                  </Label>
                  <Select
                    value={typeDetails.landShape || "Rectangular"}
                    onValueChange={(val) => setTypeDetails((p) => ({ ...p, landShape: val }))}
                  >
                    <SelectTrigger className="h-11 border-[#E8E1D4] rounded-xl bg-[#FCFBF7] text-[#07111F]">
                      <SelectValue placeholder="Shape" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#FCFBF7] border-[#E8E1D4]">
                      <SelectItem value="Rectangular">Regular Rectangular</SelectItem>
                      <SelectItem value="Square">Square Plot</SelectItem>
                      <SelectItem value="Corner Plot">Corner Plot (Dual Frontage)</SelectItem>
                      <SelectItem value="Irregular">Irregular Boundary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">
                    Title Deed &amp; Ownership Document <span className="text-[#C89B3C]">*</span>
                  </Label>
                  <Select
                    value={typeDetails.titleDeedStatus || "Registered Title Deed"}
                    onValueChange={(val) => setTypeDetails((p) => ({ ...p, titleDeedStatus: val }))}
                  >
                    <SelectTrigger className="h-11 border-[#E8E1D4] rounded-xl bg-[#FCFBF7] text-[#07111F]">
                      <SelectValue placeholder="Ownership document" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#FCFBF7] border-[#E8E1D4]">
                      <SelectItem value="Registered Title Deed">Official Registered Title Deed</SelectItem>
                      <SelectItem value="Notarized Bill of Sale">Notarized Bill of Sale / Municipal Deed</SelectItem>
                      <SelectItem value="In Verification Process">In Verification Process</SelectItem>
                      <SelectItem value="Customary Freehold">Customary Freehold Certificate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Road Access</Label>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setTypeDetails((p) => ({ ...p, roadAccess: true }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        typeDetails.roadAccess !== false
                          ? "bg-[#07111F] text-[#FCFBF7] border-[#07111F]"
                          : "border-[#E8E1D4] text-[#6B7280] bg-[#FCFBF7]"
                      }`}
                    >
                      Yes, Road Access
                    </button>
                    <button
                      type="button"
                      onClick={() => setTypeDetails((p) => ({ ...p, roadAccess: false }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        typeDetails.roadAccess === false
                          ? "bg-[#07111F] text-[#FCFBF7] border-[#07111F]"
                          : "border-[#E8E1D4] text-[#6B7280] bg-[#FCFBF7]"
                      }`}
                    >
                      No Road
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Road Width (meters)</Label>
                  <Input
                    type="number"
                    value={typeDetails.roadWidth || "12"}
                    onChange={(e) => setTypeDetails((p) => ({ ...p, roadWidth: e.target.value }))}
                    placeholder="e.g. 12"
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Water Connection</Label>
                  <Select
                    value={typeDetails.waterAvailability || "Available"}
                    onValueChange={(val) => setTypeDetails((p) => ({ ...p, waterAvailability: val }))}
                  >
                    <SelectTrigger className="h-11 border-[#E8E1D4] rounded-xl bg-[#FCFBF7] text-[#07111F]">
                      <SelectValue placeholder="Water status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#FCFBF7] border-[#E8E1D4]">
                      <SelectItem value="Available">Connected / Available</SelectItem>
                      <SelectItem value="Nearby Pipeline">Nearby Pipeline (&lt; 100m)</SelectItem>
                      <SelectItem value="Borehole Required">Borehole / Well Required</SelectItem>
                      <SelectItem value="Not Connected">Not Connected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Electricity Connection</Label>
                  <Select
                    value={typeDetails.electricityAvailability || "Available"}
                    onValueChange={(val) => setTypeDetails((p) => ({ ...p, electricityAvailability: val }))}
                  >
                    <SelectTrigger className="h-11 border-[#E8E1D4] rounded-xl bg-[#FCFBF7] text-[#07111F]">
                      <SelectValue placeholder="Power status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#FCFBF7] border-[#E8E1D4]">
                      <SelectItem value="Available">Mains Power Connected</SelectItem>
                      <SelectItem value="Nearby Grid">Nearby Grid Post</SelectItem>
                      <SelectItem value="Solar / Off-grid">Solar / Generator Only</SelectItem>
                      <SelectItem value="Not Available">Not Connected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Boundary / Perimeter</Label>
                  <Select
                    value={typeDetails.boundary || "Marked Boundary"}
                    onValueChange={(val) => setTypeDetails((p) => ({ ...p, boundary: val }))}
                  >
                    <SelectTrigger className="h-11 border-[#E8E1D4] rounded-xl bg-[#FCFBF7] text-[#07111F]">
                      <SelectValue placeholder="Perimeter" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#FCFBF7] border-[#E8E1D4]">
                      <SelectItem value="Perimeter Wall">Solid Stone / Perimeter Wall</SelectItem>
                      <SelectItem value="Fenced">Wire Fenced</SelectItem>
                      <SelectItem value="Marked Boundary">Survey Beacons / Pegs</SelectItem>
                      <SelectItem value="Open Unfenced">Open Unfenced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────
              B. APARTMENT SPECIFIC FORM
             ────────────────────────────────────────── */}
          {selectedType === "APARTMENT" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">
                    Bedrooms <span className="text-[#C89B3C]">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={common.bedrooms}
                    onChange={(e) => setCommon((p) => ({ ...p, bedrooms: e.target.value }))}
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm font-bold"
                    required
                  />
                  {validationErrors.bedrooms && (
                    <span className="text-[11px] text-red-600 font-semibold">{validationErrors.bedrooms}</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">
                    Bathrooms <span className="text-[#C89B3C]">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={common.bathrooms}
                    onChange={(e) => setCommon((p) => ({ ...p, bathrooms: e.target.value }))}
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm font-bold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">
                    Apartment Area (m²) <span className="text-[#C89B3C]">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={common.area}
                    onChange={(e) => setCommon((p) => ({ ...p, area: e.target.value }))}
                    placeholder="120"
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm font-bold"
                    required
                  />
                  {validationErrors.area && (
                    <span className="text-[11px] text-red-600 font-semibold">{validationErrors.area}</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Parking Spaces</Label>
                  <Input
                    type="number"
                    value={common.parking}
                    onChange={(e) => setCommon((p) => ({ ...p, parking: e.target.value }))}
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Floor Number</Label>
                  <Input
                    type="number"
                    value={typeDetails.floorNumber || "3"}
                    onChange={(e) => setTypeDetails((p) => ({ ...p, floorNumber: e.target.value }))}
                    placeholder="3"
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Total Building Floors</Label>
                  <Input
                    type="number"
                    value={typeDetails.totalFloors || "8"}
                    onChange={(e) => setTypeDetails((p) => ({ ...p, totalFloors: e.target.value }))}
                    placeholder="8"
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Balcony</Label>
                  <Select
                    value={typeDetails.hasBalcony !== false ? "YES" : "NO"}
                    onValueChange={(val) => setTypeDetails((p) => ({ ...p, hasBalcony: val === "YES" }))}
                  >
                    <SelectTrigger className="h-11 border-[#E8E1D4] rounded-xl bg-[#FCFBF7] text-[#07111F]">
                      <SelectValue placeholder="Balcony" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#FCFBF7] border-[#E8E1D4]">
                      <SelectItem value="YES">Yes, Private Balcony</SelectItem>
                      <SelectItem value="NO">No Balcony</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Building Elevator</Label>
                  <Select
                    value={typeDetails.hasElevator !== false ? "YES" : "NO"}
                    onValueChange={(val) => setTypeDetails((p) => ({ ...p, hasElevator: val === "YES" }))}
                  >
                    <SelectTrigger className="h-11 border-[#E8E1D4] rounded-xl bg-[#FCFBF7] text-[#07111F]">
                      <SelectValue placeholder="Elevator" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#FCFBF7] border-[#E8E1D4]">
                      <SelectItem value="YES">Elevator Operational</SelectItem>
                      <SelectItem value="NO">Stairs Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  id="apt-furnished"
                  type="checkbox"
                  checked={common.isFurnished}
                  onChange={(e) => setCommon((p) => ({ ...p, isFurnished: e.target.checked }))}
                  className="h-4 w-4 text-[#C89B3C] rounded border-[#E8E1D4] accent-[#C89B3C]"
                />
                <Label htmlFor="apt-furnished" className="text-xs font-bold text-[#07111F] cursor-pointer">
                  Furnished Apartment (Includes furniture &amp; appliances)
                </Label>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────
              C. VILLA SPECIFIC FORM
             ────────────────────────────────────────── */}
          {selectedType === "VILLA" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">
                    Bedrooms / Suites <span className="text-[#C89B3C]">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={common.bedrooms}
                    onChange={(e) => setCommon((p) => ({ ...p, bedrooms: e.target.value }))}
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm font-bold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">
                    Bathrooms <span className="text-[#C89B3C]">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={common.bathrooms}
                    onChange={(e) => setCommon((p) => ({ ...p, bathrooms: e.target.value }))}
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm font-bold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">
                    Building Area (m²) <span className="text-[#C89B3C]">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={common.area}
                    onChange={(e) => setCommon((p) => ({ ...p, area: e.target.value }))}
                    placeholder="350"
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm font-bold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Compound / Lot (m²)</Label>
                  <Input
                    type="number"
                    value={common.lotSize || typeDetails.compoundSize || ""}
                    onChange={(e) => {
                      setCommon((p) => ({ ...p, lotSize: e.target.value }));
                      setTypeDetails((p) => ({ ...p, compoundSize: e.target.value }));
                    }}
                    placeholder="600"
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Garage / Parking</Label>
                  <Input
                    type="number"
                    value={common.parking}
                    onChange={(e) => setCommon((p) => ({ ...p, parking: e.target.value }))}
                    placeholder="3"
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Villa Storeys</Label>
                  <Input
                    type="number"
                    value={typeDetails.floors || "2"}
                    onChange={(e) => setTypeDetails((p) => ({ ...p, floors: e.target.value }))}
                    placeholder="2"
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Swimming Pool</Label>
                  <Select
                    value={typeDetails.hasPool ? "YES" : "NO"}
                    onValueChange={(val) => setTypeDetails((p) => ({ ...p, hasPool: val === "YES" }))}
                  >
                    <SelectTrigger className="h-11 border-[#E8E1D4] rounded-xl bg-[#FCFBF7] text-[#07111F]">
                      <SelectValue placeholder="Pool" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#FCFBF7] border-[#E8E1D4]">
                      <SelectItem value="YES">Private Swimming Pool</SelectItem>
                      <SelectItem value="NO">No Pool</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Maid Quarters</Label>
                  <Select
                    value={typeDetails.hasMaidRoom !== false ? "YES" : "NO"}
                    onValueChange={(val) => setTypeDetails((p) => ({ ...p, hasMaidRoom: val === "YES" }))}
                  >
                    <SelectTrigger className="h-11 border-[#E8E1D4] rounded-xl bg-[#FCFBF7] text-[#07111F]">
                      <SelectValue placeholder="Maid room" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#FCFBF7] border-[#E8E1D4]">
                      <SelectItem value="YES">Staff Room Included</SelectItem>
                      <SelectItem value="NO">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────
              D. HOUSE SPECIFIC FORM
             ────────────────────────────────────────── */}
          {selectedType === "HOUSE" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">
                    Bedrooms <span className="text-[#C89B3C]">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={common.bedrooms}
                    onChange={(e) => setCommon((p) => ({ ...p, bedrooms: e.target.value }))}
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm font-bold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">
                    Bathrooms <span className="text-[#C89B3C]">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={common.bathrooms}
                    onChange={(e) => setCommon((p) => ({ ...p, bathrooms: e.target.value }))}
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm font-bold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">
                    Area (m²) <span className="text-[#C89B3C]">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={common.area}
                    onChange={(e) => setCommon((p) => ({ ...p, area: e.target.value }))}
                    placeholder="180"
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm font-bold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Compound / Lot (m²)</Label>
                  <Input
                    type="number"
                    value={common.lotSize}
                    onChange={(e) => setCommon((p) => ({ ...p, lotSize: e.target.value }))}
                    placeholder="300"
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Parking Spaces</Label>
                  <Input
                    type="number"
                    value={common.parking}
                    onChange={(e) => setCommon((p) => ({ ...p, parking: e.target.value }))}
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Floors</Label>
                  <Input
                    type="number"
                    value={typeDetails.floors || "1"}
                    onChange={(e) => setTypeDetails((p) => ({ ...p, floors: e.target.value }))}
                    placeholder="1"
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Year Built</Label>
                  <Input
                    type="number"
                    value={common.yearBuilt}
                    onChange={(e) => setCommon((p) => ({ ...p, yearBuilt: e.target.value }))}
                    placeholder="2022"
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    id="house-furnished"
                    type="checkbox"
                    checked={common.isFurnished}
                    onChange={(e) => setCommon((p) => ({ ...p, isFurnished: e.target.checked }))}
                    className="h-4 w-4 text-[#C89B3C] rounded border-[#E8E1D4] accent-[#C89B3C]"
                  />
                  <Label htmlFor="house-furnished" className="text-xs font-bold text-[#07111F] cursor-pointer">
                    Furnished House
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────
              E. SHOP SPECIFIC FORM
             ────────────────────────────────────────── */}
          {selectedType === "SHOP" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">
                    Retail Shop Area (m²) <span className="text-[#C89B3C]">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={typeDetails.shopArea || common.area || ""}
                    onChange={(e) => {
                      setTypeDetails((p) => ({ ...p, shopArea: e.target.value }));
                      setCommon((p) => ({ ...p, area: e.target.value }));
                    }}
                    placeholder="65"
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm font-bold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Display Frontage Width (m)</Label>
                  <Input
                    type="number"
                    value={typeDetails.frontageWidth || "6"}
                    onChange={(e) => setTypeDetails((p) => ({ ...p, frontageWidth: e.target.value }))}
                    placeholder="e.g. 6"
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Floor Level</Label>
                  <Select
                    value={typeDetails.floorLevel || "Ground Floor"}
                    onValueChange={(val) => setTypeDetails((p) => ({ ...p, floorLevel: val }))}
                  >
                    <SelectTrigger className="h-11 border-[#E8E1D4] rounded-xl bg-[#FCFBF7] text-[#07111F]">
                      <SelectValue placeholder="Floor" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#FCFBF7] border-[#E8E1D4]">
                      <SelectItem value="Ground Floor">Ground Floor (Street Access)</SelectItem>
                      <SelectItem value="First Floor">1st Floor / Mezzanine</SelectItem>
                      <SelectItem value="Shopping Mall">Shopping Mall Unit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Storage Area (m²)</Label>
                  <Input
                    type="number"
                    value={typeDetails.storageArea || "15"}
                    onChange={(e) => setTypeDetails((p) => ({ ...p, storageArea: e.target.value }))}
                    placeholder="15"
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Bathrooms</Label>
                  <Input
                    type="number"
                    value={common.bathrooms}
                    onChange={(e) => setCommon((p) => ({ ...p, bathrooms: e.target.value }))}
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Suitable Business Type</Label>
                  <Input
                    value={typeDetails.suitableBusiness || "Fashion / Electronics / Pharmacy"}
                    onChange={(e) => setTypeDetails((p) => ({ ...p, suitableBusiness: e.target.value }))}
                    placeholder="e.g. Pharmacy, Fashion, Grocery"
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────
              F. WAREHOUSE SPECIFIC FORM
             ────────────────────────────────────────── */}
          {selectedType === "WAREHOUSE" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">
                    Warehouse Floor Area (m²) <span className="text-[#C89B3C]">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={typeDetails.warehouseArea || common.area || ""}
                    onChange={(e) => {
                      setTypeDetails((p) => ({ ...p, warehouseArea: e.target.value }));
                      setCommon((p) => ({ ...p, area: e.target.value }));
                    }}
                    placeholder="800"
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm font-bold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Ceiling Clear Height (m)</Label>
                  <Input
                    type="number"
                    value={typeDetails.ceilingHeight || "9"}
                    onChange={(e) => setTypeDetails((p) => ({ ...p, ceilingHeight: e.target.value }))}
                    placeholder="9"
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Compound / Yard Size (m²)</Label>
                  <Input
                    type="number"
                    value={typeDetails.compoundSize || common.lotSize || ""}
                    onChange={(e) => {
                      setTypeDetails((p) => ({ ...p, compoundSize: e.target.value }));
                      setCommon((p) => ({ ...p, lotSize: e.target.value }));
                    }}
                    placeholder="1500"
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Loading Bays / Dock Levelers</Label>
                  <Input
                    value={typeDetails.loadingBays || "2 Dock Levelers"}
                    onChange={(e) => setTypeDetails((p) => ({ ...p, loadingBays: e.target.value }))}
                    placeholder="e.g. 2 Docks"
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Trailer &amp; Truck Access</Label>
                  <Select
                    value={typeDetails.truckAccess || "Full Trailer Access"}
                    onValueChange={(val) => setTypeDetails((p) => ({ ...p, truckAccess: val }))}
                  >
                    <SelectTrigger className="h-11 border-[#E8E1D4] rounded-xl bg-[#FCFBF7] text-[#07111F]">
                      <SelectValue placeholder="Truck access" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#FCFBF7] border-[#E8E1D4]">
                      <SelectItem value="Full Trailer Access">Full 40ft Container Trailer Access</SelectItem>
                      <SelectItem value="Medium Rigid Truck">Medium Rigid Truck Only</SelectItem>
                      <SelectItem value="Light Commercial">Light Commercial Van Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Admin Office Area (m²)</Label>
                  <Input
                    type="number"
                    value={typeDetails.officeArea || "80"}
                    onChange={(e) => setTypeDetails((p) => ({ ...p, officeArea: e.target.value }))}
                    placeholder="80"
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────
              G. OFFICE / COMMERCIAL SPECIFIC FORM
             ────────────────────────────────────────── */}
          {(selectedType === "OFFICE" || selectedType === "COMMERCIAL") && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">
                    Floor Area (m²) <span className="text-[#C89B3C]">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={typeDetails.floorArea || common.area || ""}
                    onChange={(e) => {
                      setTypeDetails((p) => ({ ...p, floorArea: e.target.value }));
                      setCommon((p) => ({ ...p, area: e.target.value }));
                    }}
                    placeholder="250"
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm font-bold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Commercial Classification</Label>
                  <Select
                    value={typeDetails.commercialType || "Corporate Office"}
                    onValueChange={(val) => setTypeDetails((p) => ({ ...p, commercialType: val }))}
                  >
                    <SelectTrigger className="h-11 border-[#E8E1D4] rounded-xl bg-[#FCFBF7] text-[#07111F]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#FCFBF7] border-[#E8E1D4]">
                      <SelectItem value="Corporate Office">Corporate Headquarters / Office</SelectItem>
                      <SelectItem value="Medical Center">Medical Center / Clinic</SelectItem>
                      <SelectItem value="Banking Hall">Retail Banking Hall</SelectItem>
                      <SelectItem value="Tech Co-Working">Tech Hub &amp; Co-Working</SelectItem>
                      <SelectItem value="Commercial Plaza">Commercial Plaza Hub</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Meeting Rooms</Label>
                  <Input
                    type="number"
                    value={typeDetails.meetingRooms || "2"}
                    onChange={(e) => setTypeDetails((p) => ({ ...p, meetingRooms: e.target.value }))}
                    placeholder="2"
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Parking Spaces</Label>
                  <Input
                    type="number"
                    value={common.parking}
                    onChange={(e) => setCommon((p) => ({ ...p, parking: e.target.value }))}
                    placeholder="6"
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Restrooms</Label>
                  <Input
                    type="number"
                    value={common.bathrooms}
                    onChange={(e) => setCommon((p) => ({ ...p, bathrooms: e.target.value }))}
                    className="h-11 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#07111F]">Fit-out Status</Label>
                  <Select
                    value={typeDetails.fitoutStatus || "Fully Fitted"}
                    onValueChange={(val) => setTypeDetails((p) => ({ ...p, fitoutStatus: val }))}
                  >
                    <SelectTrigger className="h-11 border-[#E8E1D4] rounded-xl bg-[#FCFBF7] text-[#07111F]">
                      <SelectValue placeholder="Fitout" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#FCFBF7] border-[#E8E1D4]">
                      <SelectItem value="Fully Fitted">Fully Fitted &amp; Partitioned</SelectItem>
                      <SelectItem value="Semi-Fitted">Semi-Fitted</SelectItem>
                      <SelectItem value="Shell & Core">Shell &amp; Core</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────
              TYPE-SPECIFIC AMENITIES & FEATURES CHECKBOXES
             ────────────────────────────────────────── */}
          <div className="pt-4 border-t border-[#E8E1D4] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-sm text-[#07111F] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#C89B3C]" />
                {getPropertyTypeLabel(selectedType)} Verified Features &amp; Utilities
              </h3>
              <span className="text-[11px] text-[#6B7280]">
                {selectedAmenities.length} selected
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {(TYPE_AMENITIES[selectedType] || TYPE_AMENITIES.OTHER).map((amenity) => {
                const isChecked = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => handleAmenityToggle(amenity)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      isChecked
                        ? "bg-[#07111F] text-[#D9B45B] border-[#07111F]"
                        : "bg-[#FCFBF7] text-[#07111F] border-[#E8E1D4] hover:bg-[#F7F3EA]"
                    }`}
                  >
                    <span className="truncate">{amenity}</span>
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${
                      isChecked ? "bg-[#C89B3C] text-[#07111F]" : "border border-[#E8E1D4]"
                    }`}>
                      {isChecked ? "✓" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E8E1D4] flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              className="gap-2 border-[#E8E1D4] rounded-xl text-xs font-bold"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Basic Info
            </Button>
            <Button
              type="button"
              onClick={handleNextStep}
              className="gap-2 bg-[#07111F] hover:bg-[#07111F]/90 text-[#FCFBF7] font-bold rounded-xl px-6 h-11 cursor-pointer"
            >
              Continue to Media &amp; Tours <ArrowRight className="h-4 w-4 text-[#D9B45B]" />
            </Button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          STEP 4: MEDIA, VIDEO TOUR & FLOOR PLANS
         ════════════════════════════════════════════════════════ */}
      {currentStep === 4 && (
        <div className="bg-[#FCFBF7] rounded-3xl shadow-sm border border-[#E8E1D4] p-6 sm:p-8 space-y-7">
          <div className="border-b border-[#E8E1D4] pb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#07111F] text-[#D9B45B] text-[10px] font-bold uppercase tracking-wider mb-2">
              Step 4 of 5
            </span>
            <h2 className="text-2xl font-serif font-black text-[#07111F]">
              Media, Video Tour &amp; Floor Plans
            </h2>
            <p className="text-xs text-[#6B7280] mt-1">
              Upload primary showcase photo, gallery images, video tours, floor plans, and link virtual tours.
            </p>
          </div>

          <div className="space-y-6">
            {/* 1. Primary Property Image * */}
            <div className="space-y-2.5">
              <input
                type="file"
                id="primary-property-image-upload"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadCover(file);
                  e.target.value = "";
                }}
              />

              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-[#07111F] flex items-center gap-2">
                  <Camera className="h-4 w-4 text-[#C89B3C]" />
                  Primary Property Image <span className="text-[#C89B3C]">*</span>
                </Label>
                <button
                  type="button"
                  onClick={() => setShowCoverUrlInput(!showCoverUrlInput)}
                  className="text-xs font-semibold text-[#A97918] hover:underline cursor-pointer"
                >
                  {showCoverUrlInput ? "Hide URL input" : "Or paste image URL"}
                </button>
              </div>

              {validationErrors.imageUrl && (
                <p className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded-xl border border-red-200">
                  {validationErrors.imageUrl}
                </p>
              )}

              {media.imageUrl ? (
                <div className="space-y-3">
                  <div className="aspect-16/9 max-w-md rounded-2xl overflow-hidden border-2 border-[#C89B3C]/50 bg-[#F7F3EA] relative shadow-sm group">
                    <img
                      src={media.imageUrl}
                      alt="Primary Showcase"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as any).style.display = "none";
                      }}
                    />
                    <span className="absolute top-2.5 left-2.5 bg-[#07111F]/85 backdrop-blur-xs text-[#D9B45B] text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs">
                      Cover Image Active
                    </span>

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label
                        htmlFor="primary-property-image-upload"
                        className="inline-flex items-center gap-1.5 bg-[#07111F] text-[#FCFBF7] text-xs font-bold px-3.5 py-2 rounded-xl cursor-pointer hover:bg-black transition-colors shadow-md"
                      >
                        {uploadingCover ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5 text-[#D9B45B]" />}
                        <span>Change Image</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setMedia((p) => ({ ...p, imageUrl: "" }))}
                        className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors shadow-md cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="primary-property-image-upload"
                      className="inline-flex items-center gap-2 bg-[#FCFBF7] border border-[#C89B3C] text-[#07111F] hover:bg-[#F7F3EA] font-bold text-xs px-4 py-2 rounded-xl cursor-pointer transition-all shadow-2xs"
                    >
                      {uploadingCover ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#C89B3C]" /> : <Camera className="h-3.5 w-3.5 text-[#C89B3C]" />}
                      <span>{uploadingCover ? "Uploading Image..." : "Upload New Cover Image"}</span>
                    </label>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="primary-property-image-upload"
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleUploadCover(file);
                  }}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#C89B3C]/50 hover:border-[#C89B3C] bg-[#F7F3EA]/60 hover:bg-[#F7F3EA] rounded-2xl cursor-pointer transition-all text-center group"
                >
                  {uploadingCover ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-9 w-9 animate-spin text-[#C89B3C]" />
                      <p className="text-xs font-bold text-[#07111F]">Uploading image...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                        <Camera className="h-6 w-6" />
                      </div>
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs">
                          <Camera className="h-4 w-4" /> Upload Image
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280] mt-1">High-resolution JPG, PNG, or WEBP up to 25MB</p>
                    </div>
                  )}
                </label>
              )}

              {showCoverUrlInput && (
                <div className="pt-2 space-y-1">
                  <Label className="text-xs font-semibold text-[#6B7280]">Direct Image URL</Label>
                  <Input
                    name="imageUrl"
                    value={media.imageUrl}
                    onChange={(e) => setMedia((p) => ({ ...p, imageUrl: e.target.value }))}
                    placeholder="https://images.unsplash.com/..."
                    className="h-10 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-xs"
                  />
                </div>
              )}
            </div>

            {/* 2. Property Gallery */}
            <div className="space-y-3 pt-4 border-t border-[#E8E1D4]">
              <input
                type="file"
                id="property-gallery-upload"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleUploadGallery(e.target.files);
                    e.target.value = "";
                  }
                }}
              />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-bold text-[#07111F] flex items-center gap-2">
                    <Camera className="h-4 w-4 text-[#C89B3C]" />
                    Property Gallery
                  </Label>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Upload multiple images to showcase all rooms, exterior, and features in lightbox and carousel.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGalleryUrlInput(!showGalleryUrlInput)}
                  className="text-xs font-semibold text-[#A97918] hover:underline cursor-pointer"
                >
                  {showGalleryUrlInput ? "Hide URL input" : "Or add by URL"}
                </button>
              </div>

              <label
                htmlFor="property-gallery-upload"
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleUploadGallery(e.dataTransfer.files);
                  }
                }}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#C89B3C]/50 hover:border-[#C89B3C] bg-[#FCFBF7] hover:bg-[#F7F3EA] rounded-2xl cursor-pointer transition-all text-center group"
              >
                {uploadingGallery ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-[#C89B3C]" />
                    <p className="text-xs font-bold text-[#07111F]">Uploading gallery images...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                      <Camera className="h-6 w-6" />
                    </div>
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs">
                        <Camera className="h-4 w-4" /> Upload Multiple Images
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1">Select multiple photos from your device at once</p>
                  </div>
                )}
              </label>

              {showGalleryUrlInput && (
                <div className="flex gap-2 pt-1">
                  <Input
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddGalleryImage();
                      }
                    }}
                    placeholder="Paste additional image URL (e.g. https://...)"
                    className="h-10 flex-1 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-xs"
                  />
                  <Button
                    type="button"
                    onClick={handleAddGalleryImage}
                    className="gap-1.5 bg-[#07111F] text-[#FCFBF7] font-bold rounded-xl text-xs h-10 px-4 shrink-0 cursor-pointer"
                  >
                    <Plus className="h-4 w-4 text-[#D9B45B]" /> Add Image
                  </Button>
                </div>
              )}

              {galleryImages.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-bold text-[#07111F] mb-2">
                    Gallery Images ({galleryImages.length}):
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {galleryImages.map((img, idx) => (
                      <div
                        key={`${img}-${idx}`}
                        className="aspect-4/3 rounded-xl overflow-hidden border border-[#E8E1D4] bg-[#F7F3EA] relative group shadow-2xs"
                      >
                        <img
                          src={img}
                          alt={`Gallery ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as any).style.display = "none";
                          }}
                        />
                        <span className="absolute bottom-1.5 left-1.5 bg-[#07111F]/70 backdrop-blur-xs text-[#FCFBF7] text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryImage(idx)}
                          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center opacity-85 hover:opacity-100 hover:scale-105 transition-all cursor-pointer shadow-md"
                          title="Remove Image"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Video Tour: [ Upload Video ] OR [ YouTube/Vimeo URL ] */}
            <div className="space-y-3 pt-4 border-t border-[#E8E1D4]">
              <input
                type="file"
                id="video-tour-upload"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadVideo(file);
                  e.target.value = "";
                }}
              />

              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-[#07111F] flex items-center gap-2">
                  <Video className="h-4 w-4 text-[#C89B3C]" />
                  Video Tour
                </Label>
                {media.videoUrl && (
                  <button
                    type="button"
                    onClick={() => setMedia((p) => ({ ...p, videoUrl: "" }))}
                    className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                  >
                    Remove Video
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Upload Video Button / Box */}
                <label
                  htmlFor="video-tour-upload"
                  className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-[#C89B3C]/50 hover:border-[#C89B3C] bg-[#FCFBF7] hover:bg-[#F7F3EA] rounded-2xl cursor-pointer transition-all text-center group"
                >
                  {uploadingVideo ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <Loader2 className="h-7 w-7 animate-spin text-[#C89B3C]" />
                      <p className="text-xs font-bold text-[#07111F]">Uploading video...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <span className="inline-flex items-center gap-2 bg-[#07111F] text-[#FCFBF7] font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs group-hover:bg-[#07111F]/90 transition-all">
                        <Video className="h-4 w-4 text-[#D9B45B]" /> Upload Video
                      </span>
                      <p className="text-[11px] text-[#6B7280]">MP4, WebM, MOV from device (up to 100MB)</p>
                    </div>
                  )}
                </label>

                {/* OR YouTube/Vimeo URL */}
                <div className="flex flex-col justify-center p-5 border border-[#E8E1D4] bg-[#FCFBF7] rounded-2xl space-y-2">
                  <Label className="text-xs font-bold text-[#07111F]">
                    OR YouTube / Vimeo URL
                  </Label>
                  <Input
                    name="videoUrl"
                    value={media.videoUrl}
                    onChange={(e) => setMedia((p) => ({ ...p, videoUrl: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="h-10 border-[#E8E1D4] bg-white rounded-xl text-xs"
                  />
                  <p className="text-[11px] text-[#6B7280]">Paste video link or embedded streaming URL</p>
                </div>
              </div>

              {media.videoUrl && (
                <div className="p-3 bg-[#F7F3EA] rounded-xl border border-[#E8E1D4] flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#07111F] truncate max-w-md">
                    Attached Video: <span className="font-mono text-[#A97918]">{media.videoUrl}</span>
                  </span>
                  <span className="text-[10px] font-bold bg-[#07111F] text-[#D9B45B] px-2 py-0.5 rounded-md">
                    Ready
                  </span>
                </div>
              )}
            </div>

            {/* 4. Floor Plan & 5. 360° Virtual Tour */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-[#E8E1D4]">
              {/* Floor Plan: [ 📐 Upload Image/PDF ] */}
              <div className="space-y-2.5">
                <input
                  type="file"
                  id="floorplan-file-upload"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadFloorPlan(f);
                    e.target.value = "";
                  }}
                />

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold text-[#07111F] flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#C89B3C]" />
                    Floor Plan
                  </Label>
                  {media.floorPlanUrl && (
                    <button
                      type="button"
                      onClick={() => setMedia((p) => ({ ...p, floorPlanUrl: "" }))}
                      className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <label
                  htmlFor="floorplan-file-upload"
                  className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-[#C89B3C]/50 hover:border-[#C89B3C] bg-[#FCFBF7] hover:bg-[#F7F3EA] rounded-2xl cursor-pointer transition-all text-center group"
                >
                  {uploadingFloorPlan ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <Loader2 className="h-7 w-7 animate-spin text-[#C89B3C]" />
                      <p className="text-xs font-bold text-[#07111F]">Uploading floor plan...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <span className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs">
                        <FileText className="h-4 w-4" /> Upload Image/PDF
                      </span>
                      <p className="text-[11px] text-[#6B7280]">Architectural layout (JPG, PNG, or PDF)</p>
                    </div>
                  )}
                </label>

                {media.floorPlanUrl && (
                  <p className="text-xs text-[#07111F] bg-[#F7F3EA] p-2.5 rounded-xl border border-[#E8E1D4] truncate font-mono">
                    Attached: {media.floorPlanUrl}
                  </p>
                )}
              </div>

              {/* 360° Virtual Tour: [ 🌐 Paste Virtual Tour URL ] */}
              <div className="space-y-2.5">
                <Label className="text-sm font-bold text-[#07111F] flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[#C89B3C]" />
                  360° Virtual Tour
                </Label>
                <div className="p-5 border border-[#E8E1D4] bg-[#FCFBF7] rounded-2xl space-y-2">
                  <Label className="text-xs font-bold text-[#07111F]">
                    Paste Virtual Tour URL
                  </Label>
                  <Input
                    name="virtualTourUrl"
                    value={media.virtualTourUrl}
                    onChange={(e) => setMedia((p) => ({ ...p, virtualTourUrl: e.target.value }))}
                    placeholder="https://my.matterport.com/show/?m=..."
                    className="h-10 border-[#E8E1D4] bg-white rounded-xl text-xs"
                  />
                  <p className="text-[11px] text-[#6B7280]">Supports Matterport, Kuula, and 360 viewer links</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons: [ Save as Draft ] [ Submit for Admin Review ] */}
          <div className="pt-5 border-t border-[#E8E1D4] flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              className="w-full sm:w-auto gap-2 border-[#E8E1D4] rounded-xl text-xs font-bold"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Specs
            </Button>

            <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
              <Button
                type="button"
                variant="outline"
                disabled={!!submitting}
                onClick={() => handleSubmit(false)}
                className="flex-1 sm:flex-none rounded-xl border-[#E8E1D4] text-[#07111F] hover:bg-[#F7F3EA] gap-2 bg-[#FCFBF7] h-11 px-5 font-bold"
              >
                {submitting === "DRAFT" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 text-[#6B7280]" />
                )}
                Save as Draft
              </Button>

              <Button
                type="button"
                disabled={!!submitting}
                onClick={() => handleSubmit(true)}
                className="flex-1 sm:flex-none rounded-xl bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] hover:opacity-95 text-[#07111F] font-bold gap-2 shadow-md shadow-[#C89B3C]/20 border-0 h-11 px-6 cursor-pointer"
              >
                {submitting === "PENDING" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {initialData?.id
                  ? isAdminMode
                    ? "Save & Publish Listing"
                    : "Save & Resubmit Listing"
                  : isAdminMode
                  ? "Publish Listing"
                  : "Submit for Admin Review"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          STEP 5: REVIEW BEFORE SUBMISSION
         ════════════════════════════════════════════════════════ */}
      {currentStep === 5 && (
        <div className="bg-[#FCFBF7] rounded-3xl shadow-sm border border-[#E8E1D4] p-6 sm:p-8 space-y-6">
          <div className="border-b border-[#E8E1D4] pb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#07111F] text-[#D9B45B] text-[10px] font-bold uppercase tracking-wider mb-2">
              Step 5 of 5 • Final Review
            </span>
            <h2 className="text-2xl font-serif font-black text-[#07111F]">
              Review Listing Before Submission
            </h2>
            <p className="text-xs text-[#6B7280] mt-1">
              Verify all entered details. You can save as a draft for later editing, or submit directly for admin verification.
            </p>
          </div>

          {/* Overview Card */}
          <div className="p-5 rounded-2xl border border-[#E8E1D4] bg-[#F7F3EA] space-y-4">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-[#07111F] text-[#D9B45B] px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {selectedCategoryName || getPropertyTypeLabel(selectedType)}
                  </span>
                  <span className="bg-[#C89B3C]/20 text-[#A97918] px-2.5 py-0.5 rounded-lg text-xs font-bold">
                    {listingType === "FOR_SALE" ? "For Sale" : "For Rent"}
                  </span>
                </div>
                <h3 className="font-serif font-black text-xl text-[#07111F]">
                  {common.title || "Untitled Property Listing"}
                </h3>
                <p className="text-xs text-[#6B7280] flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-[#C89B3C]" />
                  {common.address ? `${common.address}, ` : ""}{common.location || "District"}, {common.city}
                </p>
                {(common.latitude || common.longitude) && (
                  <p className="text-[11px] text-[#6B7280] flex items-center gap-1 mt-0.5 font-mono">
                    <Compass className="h-3 w-3 text-[#C89B3C]" />
                    Coordinates: {common.latitude || "—"}, {common.longitude || "—"}
                  </p>
                )}
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-[#6B7280]">Asking Price</span>
                <p className="text-2xl font-black text-[#07111F]">
                  <span className="text-[#C89B3C]">$</span>
                  {Number(common.price || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Type-Specific Specs Summary */}
            <div className="pt-3 border-t border-[#E8E1D4]">
              <p className="text-xs font-bold text-[#07111F] mb-2 uppercase tracking-wider">
                Type-Specific Details:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {selectedType === "LAND" ? (
                  <>
                    <div className="bg-[#FCFBF7] p-2.5 rounded-xl border border-[#E8E1D4]">
                      <span className="text-[10px] text-[#6B7280]">Land Area</span>
                      <p className="font-bold text-[#07111F]">{typeDetails.landArea || common.area} m²</p>
                    </div>
                    <div className="bg-[#FCFBF7] p-2.5 rounded-xl border border-[#E8E1D4]">
                      <span className="text-[10px] text-[#6B7280]">Land Purpose</span>
                      <p className="font-bold text-[#07111F]">{typeDetails.landUse || "Residential"}</p>
                    </div>
                    <div className="bg-[#FCFBF7] p-2.5 rounded-xl border border-[#E8E1D4]">
                      <span className="text-[10px] text-[#6B7280]">Road Access</span>
                      <p className="font-bold text-[#07111F]">{typeDetails.roadAccess ? `${typeDetails.roadWidth || 12}m Access` : "No Road"}</p>
                    </div>
                    <div className="bg-[#FCFBF7] p-2.5 rounded-xl border border-[#E8E1D4]">
                      <span className="text-[10px] text-[#6B7280]">Title Deed</span>
                      <p className="font-bold text-[#07111F] truncate">{typeDetails.titleDeedStatus || "Registered"}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-[#FCFBF7] p-2.5 rounded-xl border border-[#E8E1D4]">
                      <span className="text-[10px] text-[#6B7280]">Bedrooms</span>
                      <p className="font-bold text-[#07111F]">{common.bedrooms} Beds</p>
                    </div>
                    <div className="bg-[#FCFBF7] p-2.5 rounded-xl border border-[#E8E1D4]">
                      <span className="text-[10px] text-[#6B7280]">Bathrooms</span>
                      <p className="font-bold text-[#07111F]">{common.bathrooms} Baths</p>
                    </div>
                    <div className="bg-[#FCFBF7] p-2.5 rounded-xl border border-[#E8E1D4]">
                      <span className="text-[10px] text-[#6B7280]">Living Area</span>
                      <p className="font-bold text-[#07111F]">{common.area} m²</p>
                    </div>
                    <div className="bg-[#FCFBF7] p-2.5 rounded-xl border border-[#E8E1D4]">
                      <span className="text-[10px] text-[#6B7280]">Parking</span>
                      <p className="font-bold text-[#07111F]">{common.parking} Spaces</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Selected Features */}
            {selectedAmenities.length > 0 && (
              <div className="pt-3 border-t border-[#E8E1D4]">
                <p className="text-xs font-bold text-[#07111F] mb-1.5 uppercase tracking-wider">
                  Features ({selectedAmenities.length}):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAmenities.map((a) => (
                    <span
                      key={a}
                      className="px-2 py-0.5 rounded-md bg-[#FCFBF7] border border-[#E8E1D4] text-[11px] font-semibold text-[#07111F]"
                    >
                      ✓ {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#E8E1D4] flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              className="w-full sm:w-auto gap-2 border-[#E8E1D4] rounded-xl text-xs font-bold"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Media
            </Button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                disabled={!!submitting}
                onClick={() => handleSubmit(false)}
                className="flex-1 sm:flex-none rounded-xl border-[#E8E1D4] text-[#07111F] hover:bg-[#F7F3EA] gap-2 bg-[#FCFBF7] h-11"
              >
                {submitting === "DRAFT" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 text-[#6B7280]" />
                )}
                Save as Draft
              </Button>

              <Button
                type="button"
                disabled={!!submitting}
                onClick={() => handleSubmit(true)}
                className="flex-1 sm:flex-none rounded-xl bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] hover:opacity-95 text-[#07111F] font-bold gap-2 shadow-md shadow-[#C89B3C]/20 border-0 h-11 px-6 cursor-pointer"
              >
                {submitting === "PENDING" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {initialData?.id
                  ? isAdminMode
                    ? "Save & Publish Listing"
                    : "Save & Resubmit Listing"
                  : isAdminMode
                  ? "Publish Listing"
                  : "Submit for Admin Review"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
