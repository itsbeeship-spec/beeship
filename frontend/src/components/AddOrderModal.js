"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";


export default function AddOrderModal({ isOpen, onClose, onSubmitSuccess, orderToEdit }) {
  const queryClient = useQueryClient();
  const submitMutation = useMutation({
    mutationFn: ({ endpoint, payload, method }) => {
      return method === "PUT"
        ? api.put(endpoint, payload)
        : api.post(endpoint, payload);
    }
  });

  // Form active section tab state and refs for modal scrolling
  const [activeFormTab, setActiveFormTab] = useState("general");
  const formGeneralRef = useRef(null);
  const formShippingRef = useRef(null);
  const formProductRef = useRef(null);
  const formAdditionalRef = useRef(null);
  const formContainerRef = useRef(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  // New order form state
  const [newOrder, setNewOrder] = useState({
    orderNumber: "",
    paymentMethod: "Cash on Delivery",
    firstName: "",
    lastName: "",
    phone: "",
    pincode: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    companyName: "",
    gstNumber: "",
    billingSame: true,
    products: [{ title: "", qty: "", price: "", sku: "" }],
    shippingCharges: "",
    codCharges: "",
    discount: "",
    taxAmount: "",
    autoCalculate: true,
    collectableSame: true,
    manualTotal: "",
    collectableAmount: "",
    weight: "",
    length: "",
    breadth: "",
    height: ""
  });

  const [errors, setErrors] = useState({});

  // Pre-populate or reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveFormTab("general");
      if (orderToEdit) {
        const [first, ...lastArr] = (orderToEdit.customer || "").split(" ");
        const cleanOrderNumber = orderToEdit.id.startsWith("#") ? orderToEdit.id.slice(1) : orderToEdit.id;
        
        let addr1 = orderToEdit.address || "";
        let addr2 = "";
        
        const fallbackProducts = [{ 
          title: orderToEdit.product || "", 
          qty: orderToEdit.qty || 1, 
          price: orderToEdit.amount || 0, 
          sku: orderToEdit.sku || "" 
        }];

        setNewOrder({
          orderNumber: cleanOrderNumber,
          paymentMethod: orderToEdit.method === "COD" ? "Cash on Delivery" : "Prepaid",
          firstName: first || "",
          lastName: lastArr.join(" ") || "",
          phone: orderToEdit.phone || "",
          pincode: orderToEdit.pincode || "",
          address1: addr1,
          address2: addr2,
          city: orderToEdit.city || "",
          state: orderToEdit.state || "",
          companyName: orderToEdit.companyName || "",
          gstNumber: orderToEdit.gstNumber || "",
          billingSame: orderToEdit.billingSame !== undefined ? orderToEdit.billingSame : true,
          products: orderToEdit.products && orderToEdit.products.length > 0
            ? orderToEdit.products.map(item => ({
                title: item.title || item.name || "",
                qty: item.qty !== undefined ? item.qty : (item.quantity !== undefined ? item.quantity : 1),
                price: item.price !== undefined ? item.price : 0,
                sku: item.sku || ""
              }))
            : fallbackProducts,
          shippingCharges: orderToEdit.shippingCharges !== null ? String(orderToEdit.shippingCharges) : "",
          codCharges: orderToEdit.codCharges !== null ? String(orderToEdit.codCharges) : "",
          discount: orderToEdit.discount !== null ? String(orderToEdit.discount) : "",
          taxAmount: orderToEdit.taxAmount !== null ? String(orderToEdit.taxAmount) : "",
          autoCalculate: true,
          collectableSame: orderToEdit.method === "COD" ? orderToEdit.collectableAmount === orderToEdit.amount : true,
          manualTotal: "",
          collectableAmount: orderToEdit.collectableAmount !== null ? String(orderToEdit.collectableAmount) : "",
          weight: orderToEdit.weight !== null ? String(orderToEdit.weight) : "",
          length: orderToEdit.length || "",
          breadth: orderToEdit.breadth || "",
          height: orderToEdit.height || ""
        });
      } else {
        setNewOrder({
          orderNumber: `${Math.floor(100000000 + Math.random() * 900000000)}`,
          paymentMethod: "Cash on Delivery",
          firstName: "",
          lastName: "",
          phone: "",
          pincode: "",
          address1: "",
          address2: "",
          city: "",
          state: "",
          companyName: "",
          gstNumber: "",
          billingSame: true,
          products: [{ title: "", qty: "", price: "", sku: "" }],
          shippingCharges: "",
          codCharges: "",
          discount: "",
          taxAmount: "",
          autoCalculate: true,
          collectableSame: true,
          manualTotal: "",
          collectableAmount: "",
          weight: "",
          length: "",
          breadth: "",
          height: ""
        });
      }
      setErrors({});
    }
  }, [isOpen, orderToEdit]);

  if (!isOpen) return null;

  // Scroll to form section in modal
  const handleFormTabClick = (tabId, ref) => {
    isScrollingRef.current = true;
    setActiveFormTab(tabId);
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    if (ref.current && formContainerRef.current) {
      const container = formContainerRef.current;
      const element = ref.current;
      const targetScrollTop = element.offsetTop - container.offsetTop;
      container.scrollTo({ top: targetScrollTop, behavior: "smooth" });
    }

    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 600);
  };

  // Update active form tab on scroll inside container
  const handleFormScroll = () => {
    if (isScrollingRef.current) return;
    if (!formContainerRef.current) return;
    const container = formContainerRef.current;
    const containerTop = container.getBoundingClientRect().top;

    const getOffset = (ref) => {
      if (!ref.current) return Infinity;
      return Math.abs(ref.current.getBoundingClientRect().top - containerTop);
    };

    const offsets = [
      { id: "general", val: getOffset(formGeneralRef) },
      { id: "shipping", val: getOffset(formShippingRef) },
      { id: "product", val: getOffset(formProductRef) },
      { id: "additional", val: getOffset(formAdditionalRef) },
    ];

    offsets.sort((a, b) => a.val - b.val);
    setActiveFormTab(offsets[0].id);
  };

  // Dynamic calculated total amount helper
  const getCalculatedTotal = () => {
    if (!newOrder.autoCalculate) {
      return Math.max(0, parseFloat((newOrder.manualTotal || 0).toFixed(2)));
    }
    const productsSum = newOrder.products.reduce((acc, curr) => acc + (parseFloat(curr.price || 0) * parseInt(curr.qty || 1)), 0);
    const total = productsSum + parseFloat(newOrder.shippingCharges || 0) + parseFloat(newOrder.codCharges || 0) - parseFloat(newOrder.discount || 0) + parseFloat(newOrder.taxAmount || 0);
    return Math.max(0, parseFloat(total.toFixed(2)));
  };

  // Add Order Submit handler
  const handleAddOrderSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const errs = {};
    if (!newOrder.firstName || !newOrder.firstName.trim()) errs.firstName = "First name is required";
    if (!newOrder.phone || !newOrder.phone.trim()) errs.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(newOrder.phone.trim())) errs.phone = "Must be a 10-digit number";
    
    if (!newOrder.pincode || !newOrder.pincode.trim()) errs.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(newOrder.pincode.trim())) errs.pincode = "Must be a 6-digit pin";
    
    if (!newOrder.address1 || !newOrder.address1.trim()) errs.address1 = "Address is required";
    if (!newOrder.city || !newOrder.city.trim()) errs.city = "City is required";
    if (!newOrder.state || !newOrder.state.trim()) errs.state = "State is required";

    // Products validation
    const prodErrors = [];
    newOrder.products.forEach((prod, index) => {
      const pErr = {};
      if (!prod.title || !prod.title.trim()) pErr.title = "Product title is required";
      if (!prod.qty) pErr.qty = "Quantity is required";
      if (!prod.price) pErr.price = "Price is required";
      if (Object.keys(pErr).length > 0) {
        prodErrors[index] = pErr;
      }
    });
    if (prodErrors.length > 0) {
      errs.products = prodErrors;
    }

    if (!newOrder.weight) errs.weight = "Weight is required";
    if (!newOrder.length || !newOrder.length.trim()) errs.length = "Length is required";
    if (!newOrder.breadth || !newOrder.breadth.trim()) errs.breadth = "Breadth is required";
    if (!newOrder.height || !newOrder.height.trim()) errs.height = "Height is required";

    // Billing validation if billingSame is false
    if (!newOrder.billingSame) {
      if (!newOrder.billingFirstName || !newOrder.billingFirstName.trim()) errs.billingFirstName = "First name is required";
      if (!newOrder.billingPhone || !newOrder.billingPhone.trim()) errs.billingPhone = "Phone number is required";
      else if (!/^\d{10}$/.test(newOrder.billingPhone.trim())) errs.billingPhone = "Must be a 10-digit number";
      if (!newOrder.billingPincode || !newOrder.billingPincode.trim()) errs.billingPincode = "Pincode is required";
      else if (!/^\d{6}$/.test(newOrder.billingPincode.trim())) errs.billingPincode = "Must be a 6-digit pin";
      if (!newOrder.billingAddress1 || !newOrder.billingAddress1.trim()) errs.billingAddress1 = "Address is required";
      if (!newOrder.billingCity || !newOrder.billingCity.trim()) errs.billingCity = "City is required";
      if (!newOrder.billingState || !newOrder.billingState.trim()) errs.billingState = "State is required";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      
      // Auto-scroll to section containing error
      if (errs.firstName || errs.phone || errs.pincode || errs.address1 || errs.city || errs.state || errs.billingFirstName || errs.billingPhone || errs.billingPincode || errs.billingAddress1 || errs.billingCity || errs.billingState) {
        handleFormTabClick("shipping", formShippingRef);
      } else if (errs.products) {
        handleFormTabClick("product", formProductRef);
      } else if (errs.weight || errs.length || errs.breadth || errs.height) {
        handleFormTabClick("additional", formAdditionalRef);
      }
      return;
    }

    const customerName = `${newOrder.firstName} ${newOrder.lastName}`.trim() || "Manually Created";
    const primaryProduct = newOrder.products[0]?.title || "Generic Custom Product";
    const productSummary = newOrder.products.length > 1 
      ? `${primaryProduct} (+${newOrder.products.length - 1} more)`
      : primaryProduct;

    const orderAmount = getCalculatedTotal();
    const orderMethod = newOrder.paymentMethod === "Cash on Delivery" ? "COD" : "Prepaid";

    const payload = {
      customer: customerName,
      product: productSummary,
      amount: orderAmount,
      status: "unfulfilled",
      method: orderMethod,
      phone: newOrder.phone,
      address: `${newOrder.address1}${newOrder.address2 ? ", " + newOrder.address2 : ""}, ${newOrder.city}, ${newOrder.state} - ${newOrder.pincode}`,
      pincode: newOrder.pincode,
      city: newOrder.city,
      state: newOrder.state,
      companyName: newOrder.companyName,
      gstNumber: newOrder.gstNumber,
      billingSame: newOrder.billingSame,
      billingAddress: newOrder.billingSame 
        ? null 
        : `${newOrder.billingAddress1}${newOrder.billingAddress2 ? ", " + newOrder.billingAddress2 : ""}, ${newOrder.billingCity}, ${newOrder.billingState} - ${newOrder.billingPincode}`,
      billingPhone: newOrder.billingSame ? null : newOrder.billingPhone,
      billingPincode: newOrder.billingSame ? null : newOrder.billingPincode,
      billingCity: newOrder.billingSame ? null : newOrder.billingCity,
      billingState: newOrder.billingSame ? null : newOrder.billingState,
      billingCompanyName: newOrder.billingSame ? null : newOrder.billingCompanyName,
      billingGstNumber: newOrder.billingSame ? null : newOrder.billingGstNumber,
      products: newOrder.products,
      shippingCharges: parseFloat(newOrder.shippingCharges || 0),
      codCharges: parseFloat(newOrder.codCharges || 0),
      discount: parseFloat(newOrder.discount || 0),
      taxAmount: parseFloat(newOrder.taxAmount || 0),
      weight: parseFloat(newOrder.weight || 0.0),
      length: newOrder.length,
      breadth: newOrder.breadth,
      height: newOrder.height,
      collectableAmount: newOrder.collectableSame 
        ? orderAmount 
        : parseFloat(newOrder.collectableAmount || 0)
    };

    try {
      const endpoint = orderToEdit
        ? `/orders/${orderToEdit.id.startsWith("#") ? orderToEdit.id.slice(1) : orderToEdit.id}`
        : `/orders`;
      const method = orderToEdit ? "PUT" : "POST";
      const data = await submitMutation.mutateAsync({ endpoint, payload, method });

      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        onSubmitSuccess(data.data, false);
        onClose();
        return;
      }
      throw new Error("API failed");
    } catch (err) {

      console.error("Failed to post order to DB, adding to local fallback state:", err);
      
      const fullAddress = `${newOrder.address1}${newOrder.address2 ? ", " + newOrder.address2 : ""}, ${newOrder.city}, ${newOrder.state} - ${newOrder.pincode}`;
      
      const fallbackObj = {
        id: `#${newOrder.orderNumber}`,
        customer: customerName,
        phone: newOrder.phone || "8649882372",
        address: fullAddress || "choprajhar charkhamba, dinajpur uttar, west bengal, india, 733202",
        product: productSummary,
        sku: newOrder.products[0]?.sku || "SKU-MOCK",
        qty: parseInt(newOrder.products[0]?.qty || 1),
        date: new Date().toISOString().split("T")[0],
        amount: orderAmount,
        status: "unfulfilled",
        method: orderMethod,
        tags: [orderMethod, "Manual", "Low Risk"],
        vendor: "—"
      };

      onSubmitSuccess(fallbackObj, true); // true = offline fallback
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-slideUp font-sans flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-855">
                {orderToEdit ? `Edit Order #${orderToEdit.id.startsWith("#") ? orderToEdit.id.slice(1) : orderToEdit.id}` : "Add New Order"}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                {orderToEdit ? "Modify order details and update the database" : "Create a new order with all necessary details"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-55 rounded-xl text-slate-400 hover:text-slate-650 transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          
          {/* Left Sidebar Tabs */}
          <div className="w-56 border-r border-slate-100 bg-slate-50/50 p-5 flex flex-col gap-1 shrink-0 select-none">
            <button
              type="button"
              onClick={() => handleFormTabClick("general", formGeneralRef)}
              className={`relative flex items-center gap-3 px-4 py-3 text-xs font-bold transition rounded-xl w-full text-left cursor-pointer ${
                activeFormTab === "general"
                  ? "bg-white text-slate-800 shadow-sm border border-slate-100"
                  : "text-slate-500 hover:bg-slate-50/60"
              }`}
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>General info</span>
              {activeFormTab === "general" && (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-900 absolute right-3.5 top-1/2 -translate-y-1/2" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleFormTabClick("shipping", formShippingRef)}
              className={`relative flex items-center gap-3 px-4 py-3 text-xs font-bold transition rounded-xl w-full text-left cursor-pointer ${
                activeFormTab === "shipping"
                  ? "bg-white text-slate-800 shadow-sm border border-slate-100"
                  : "text-slate-500 hover:bg-slate-50/60"
              }`}
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1" />
              </svg>
              <span>Shipping info</span>
              {activeFormTab === "shipping" && (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-900 absolute right-3.5 top-1/2 -translate-y-1/2" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleFormTabClick("product", formProductRef)}
              className={`relative flex items-center gap-3 px-4 py-3 text-xs font-bold transition rounded-xl w-full text-left cursor-pointer ${
                activeFormTab === "product"
                  ? "bg-white text-slate-800 shadow-sm border border-slate-100"
                  : "text-slate-500 hover:bg-slate-50/60"
              }`}
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>Product info</span>
              {activeFormTab === "product" && (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-900 absolute right-3.5 top-1/2 -translate-y-1/2" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleFormTabClick("additional", formAdditionalRef)}
              className={`relative flex items-center gap-3 px-4 py-3 text-xs font-bold transition rounded-xl w-full text-left cursor-pointer ${
                activeFormTab === "additional"
                  ? "bg-white text-slate-800 shadow-sm border border-slate-100"
                  : "text-slate-500 hover:bg-slate-50/60"
              }`}
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>Additional Details</span>
              {activeFormTab === "additional" && (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-900 absolute right-3.5 top-1/2 -translate-y-1/2" />
              )}
            </button>
          </div>

          {/* Right Scrollable Panel */}
          <div
            onScroll={handleFormScroll}
            ref={formContainerRef}
            className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-8 scroll-smooth"
          >
            
            {/* 1. General Info */}
            <div ref={formGeneralRef} className="flex flex-col gap-4 pt-2">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <svg className="w-4 h-4 text-slate-550" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span>General Information</span>
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Order Number</label>
                  <input 
                    type="text" 
                    required
                    value={newOrder.orderNumber}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, orderNumber: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-slate-400 transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Payment Method</label>
                  <select 
                    value={newOrder.paymentMethod}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-slate-400 transition appearance-none cursor-pointer"
                  >
                    <option value="Cash on Delivery">Cash on Delivery</option>
                    <option value="Prepaid">Prepaid</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Shipping Info */}
            <div ref={formShippingRef} className="flex flex-col gap-4 pt-2">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <svg className="w-4 h-4 text-slate-550" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1" />
                </svg>
                <span>Shipping Information</span>
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">First Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Enter first name"
                    value={newOrder.firstName}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, firstName: e.target.value }))}
                    className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition ${
                      errors.firstName ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-slate-400"
                    }`}
                  />
                  {errors.firstName && <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.firstName}</span>}
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Last Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter last name"
                    value={newOrder.lastName}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-slate-400 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Phone Number *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter 10-digit phone number"
                    value={newOrder.phone}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, phone: e.target.value }))}
                    className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition ${
                      errors.phone ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-slate-400"
                    }`}
                  />
                  {errors.phone && <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.phone}</span>}
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Pincode *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter 6-digit pincode"
                    value={newOrder.pincode}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, pincode: e.target.value }))}
                    className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition ${
                      errors.pincode ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-slate-400"
                    }`}
                  />
                  {errors.pincode && <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.pincode}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Address *</label>
                  <textarea 
                    required
                    rows="2"
                    placeholder="Enter address"
                    value={newOrder.address1}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, address1: e.target.value }))}
                    className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition resize-none ${
                      errors.address1 ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-slate-400"
                    }`}
                  />
                  {errors.address1 && <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.address1}</span>}
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Address Line 2 (Optional)</label>
                  <textarea 
                    rows="2"
                    placeholder="Enter address line 2"
                    value={newOrder.address2}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, address2: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-slate-400 transition resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">City *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter city"
                    value={newOrder.city}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, city: e.target.value }))}
                    className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition ${
                      errors.city ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-slate-400"
                    }`}
                  />
                  {errors.city && <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.city}</span>}
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">State *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter state"
                    value={newOrder.state}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, state: e.target.value }))}
                    className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition ${
                      errors.state ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-slate-400"
                    }`}
                  />
                  {errors.state && <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.state}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Company Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter company name"
                    value={newOrder.companyName}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-slate-400 transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">GST Number</label>
                  <input 
                    type="text" 
                    placeholder="Enter 15-digit GST number"
                    value={newOrder.gstNumber}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, gstNumber: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-slate-400 transition"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 select-none mt-1">
                <input 
                  type="checkbox"
                  id="billingSame"
                  checked={newOrder.billingSame}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, billingSame: e.target.checked }))}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="billingSame" className="text-xs text-slate-700 font-bold cursor-pointer">
                  Billing Address same as Shipping Address
                </label>
              </div>

              {!newOrder.billingSame && (
                <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-6 animate-fadeIn">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-1">
                    <svg className="w-4 h-4 text-slate-550" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span>Billing Information</span>
                  </h4>
                  
                  <div className="border border-slate-150 bg-slate-50/20 rounded-2xl p-5 flex flex-col gap-4">
                    <div className="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Billing Address</div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">First Name *</label>
                        <input 
                          type="text" 
                          placeholder="Enter first name"
                          value={newOrder.billingFirstName || ""}
                          onChange={(e) => setNewOrder(prev => ({ ...prev, billingFirstName: e.target.value }))}
                          className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition ${
                            errors.billingFirstName ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-slate-400"
                          }`}
                        />
                        {errors.billingFirstName && (
                          <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.billingFirstName}</span>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Last Name</label>
                        <input 
                          type="text" 
                          placeholder="Enter last name"
                          value={newOrder.billingLastName || ""}
                          onChange={(e) => setNewOrder(prev => ({ ...prev, billingLastName: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-slate-400 transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Phone Number *</label>
                        <input 
                          type="text" 
                          required={!newOrder.billingSame}
                          placeholder="Enter 10-digit phone number"
                          value={newOrder.billingPhone || ""}
                          onChange={(e) => setNewOrder(prev => ({ ...prev, billingPhone: e.target.value }))}
                          className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition ${
                            errors.billingPhone ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-slate-400"
                          }`}
                        />
                        {errors.billingPhone && (
                          <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.billingPhone}</span>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Pincode *</label>
                        <input 
                          type="text" 
                          required={!newOrder.billingSame}
                          placeholder="Enter 6-digit pincode"
                          value={newOrder.billingPincode || ""}
                          onChange={(e) => setNewOrder(prev => ({ ...prev, billingPincode: e.target.value }))}
                          className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition ${
                            errors.billingPincode ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-slate-400"
                          }`}
                        />
                        {errors.billingPincode && (
                          <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.billingPincode}</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Address *</label>
                        <textarea 
                          required={!newOrder.billingSame}
                          rows="2"
                          placeholder="Enter address"
                          value={newOrder.billingAddress1 || ""}
                          onChange={(e) => setNewOrder(prev => ({ ...prev, billingAddress1: e.target.value }))}
                          className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition resize-none ${
                            errors.billingAddress1 ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-slate-400"
                          }`}
                        />
                        {errors.billingAddress1 && (
                          <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.billingAddress1}</span>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Address Line 2 (Optional)</label>
                        <textarea 
                          rows="2"
                          placeholder="Enter address line 2"
                          value={newOrder.billingAddress2 || ""}
                          onChange={(e) => setNewOrder(prev => ({ ...prev, billingAddress2: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-slate-400 transition resize-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">City *</label>
                        <input 
                          type="text" 
                          required={!newOrder.billingSame}
                          placeholder="Enter city"
                          value={newOrder.billingCity || ""}
                          onChange={(e) => setNewOrder(prev => ({ ...prev, billingCity: e.target.value }))}
                          className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition ${
                            errors.billingCity ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-slate-400"
                          }`}
                        />
                        {errors.billingCity && (
                          <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.billingCity}</span>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">State *</label>
                        <input 
                          type="text" 
                          required={!newOrder.billingSame}
                          placeholder="Enter state"
                          value={newOrder.billingState || ""}
                          onChange={(e) => setNewOrder(prev => ({ ...prev, billingState: e.target.value }))}
                          className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition ${
                            errors.billingState ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-slate-400"
                          }`}
                        />
                        {errors.billingState && (
                          <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.billingState}</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Company Name</label>
                        <input 
                          type="text" 
                          placeholder="Enter company name"
                          value={newOrder.billingCompanyName || ""}
                          onChange={(e) => setNewOrder(prev => ({ ...prev, billingCompanyName: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-slate-400 transition"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">GST Number</label>
                        <input 
                          type="text" 
                          placeholder="Enter 15-digit GST number"
                          value={newOrder.billingGstNumber || ""}
                          onChange={(e) => setNewOrder(prev => ({ ...prev, billingGstNumber: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-slate-400 transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Product Info */}
            <div ref={formProductRef} className="flex flex-col gap-4 pt-2">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <svg className="w-4 h-4 text-slate-550" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span>Product Information</span>
              </h4>

              <div className="flex flex-col gap-4">
                {newOrder.products.map((prod, index) => (
                  <div key={index} className="bg-slate-50/40 border border-slate-150 rounded-2xl p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Product {index + 1}</span>
                      {newOrder.products.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newProds = newOrder.products.filter((_, i) => i !== index);
                            setNewOrder(prev => ({ ...prev, products: newProds }));
                          }}
                          className="text-rose-500 hover:text-rose-700 font-bold text-[10px] uppercase cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="col-span-1 md:col-span-2">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Product Title *</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Enter product title"
                          value={prod.title || ""}
                          onChange={(e) => {
                            const newProds = [...newOrder.products];
                            newProds[index].title = e.target.value;
                            setNewOrder(prev => ({ ...prev, products: newProds }));
                          }}
                          className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition ${
                            errors.products?.[index]?.title ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-slate-400"
                          }`}
                        />
                        {errors.products?.[index]?.title && (
                          <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.products[index].title}</span>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block mb-1.5">Quantity *</label>
                        <input 
                          type="number" 
                          required 
                          min="1"
                          value={prod.qty || ""}
                          onChange={(e) => {
                            const newProds = [...newOrder.products];
                            newProds[index].qty = e.target.value;
                            setNewOrder(prev => ({ ...prev, products: newProds }));
                          }}
                          className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition ${
                            errors.products?.[index]?.qty ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-slate-400"
                          }`}
                        />
                        {errors.products?.[index]?.qty && (
                          <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.products[index].qty}</span>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Price *</label>
                        <input 
                          type="number" 
                          required 
                          step="0.01"
                          min="0"
                          value={prod.price || ""}
                          onChange={(e) => {
                            const newProds = [...newOrder.products];
                            newProds[index].price = e.target.value;
                            setNewOrder(prev => ({ ...prev, products: newProds }));
                          }}
                          className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition ${
                            errors.products?.[index]?.price ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-slate-400"
                          }`}
                        />
                        {errors.products?.[index]?.price && (
                          <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.products[index].price}</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">SKU</label>
                      <input 
                        type="text" 
                        placeholder="Enter SKU"
                        value={prod.sku || ""}
                        onChange={(e) => {
                          const newProds = [...newOrder.products];
                          newProds[index].sku = e.target.value;
                          setNewOrder(prev => ({ ...prev, products: newProds }));
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-slate-400 transition"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex">
                <button
                  type="button"
                  onClick={() => {
                    setNewOrder(prev => ({ 
                      ...prev, 
                      products: [...prev.products, { title: "", qty: 1, price: 0.01, sku: "" }] 
                    }));
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-55 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-slate-550" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Another Product</span>
                </button>
              </div>
            </div>

            {/* 4. Additional Details */}
            <div ref={formAdditionalRef} className="flex flex-col gap-4 pt-2">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <svg className="w-4 h-4 text-slate-555" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Additional Details</span>
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Shipping Charges</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newOrder.shippingCharges}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, shippingCharges: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-slate-400 transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">COD Charges</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newOrder.codCharges}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, codCharges: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-slate-400 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Discount</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newOrder.discount}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, discount: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-slate-400 transition"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Tax Amount</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newOrder.taxAmount}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, taxAmount: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-slate-400 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 select-none">
                    <input 
                      type="checkbox"
                      id="autoCalculate"
                      checked={newOrder.autoCalculate}
                      onChange={(e) => setNewOrder(prev => ({ ...prev, autoCalculate: e.target.checked }))}
                      className="rounded border-slate-350 text-blue-650 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="autoCalculate" className="text-xs text-slate-700 font-bold cursor-pointer">
                      Auto Calculate Total
                    </label>
                  </div>
                  {!newOrder.autoCalculate && (
                    <div className="animate-fadeIn mt-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Total Amount</label>
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={newOrder.manualTotal}
                        onChange={(e) => setNewOrder(prev => ({ ...prev, manualTotal: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-slate-400 transition"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 select-none">
                    <input 
                      type="checkbox"
                      id="collectableSame"
                      checked={newOrder.collectableSame}
                      onChange={(e) => setNewOrder(prev => ({ ...prev, collectableSame: e.target.checked }))}
                      className="rounded border-slate-350 text-blue-655 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="collectableSame" className="text-xs text-slate-700 font-bold cursor-pointer">
                      Collectable Amount same as Calculate Total
                    </label>
                  </div>
                  {!newOrder.collectableSame && (
                    <div className="animate-fadeIn mt-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Collectable Amount</label>
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={newOrder.collectableAmount}
                        onChange={(e) => setNewOrder(prev => ({ ...prev, collectableAmount: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-slate-400 transition"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Weight (kg) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0.01"
                    required
                    value={newOrder.weight}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, weight: e.target.value }))}
                    className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition ${
                      errors.weight ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-slate-400"
                    }`}
                  />
                  {errors.weight && <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.weight}</span>}
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Length (cm) *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Length"
                    value={newOrder.length}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, length: e.target.value }))}
                    className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition ${
                      errors.length ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-slate-400"
                    }`}
                  />
                  {errors.length && <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.length}</span>}
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Breadth (cm) *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Breadth"
                    value={newOrder.breadth}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, breadth: e.target.value }))}
                    className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition ${
                      errors.breadth ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-slate-400"
                    }`}
                  />
                  {errors.breadth && <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.breadth}</span>}
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Height (cm) *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Height"
                    value={newOrder.height}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, height: e.target.value }))}
                    className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none transition ${
                      errors.height ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-slate-400"
                    }`}
                  />
                  {errors.height && <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.height}</span>}
                </div>
              </div>
            </div>

          </div>
        </div>        {/* Modal Footer */}
        <div className="flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/40 shrink-0 select-none">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-750 hover:bg-slate-50 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleAddOrderSubmit}
              type="button"
              className="px-5 py-2.5 bg-[#013c9c] hover:bg-[#002f80] text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer"
            >
              {orderToEdit ? "Update Order" : "Create Order"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
