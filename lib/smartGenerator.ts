// Smart Icon Generator Engine
// Provides high-demand, commercial 32-icon sets for any theme offline without requiring an API key.

const THEME_KEYWORD_MAP: Record<string, string[]> = {
  strategy: [
    "Target and Dart", "Chess King Piece", "Growth Chart with Arrow", "Lightbulb Idea",
    "Gears and Cogwheels", "Puzzle Pieces Connecting", "Compass Direction", "Roadmap Milestone",
    "Handshake Agreement", "Rocket Launch", "Trophy Award", "Brainstorming Mind",
    "SWOT Matrix Grid", "Magnifying Glass Strategy", "Leadership Podium", "Megaphone Vision",
    "Hierarchy Organizational Chart", "Key to Success", "Bar Graph Ascending", "Pie Chart Analytics",
    "Shield Protection Plan", "Briefcase Executive", "Checklist Clipboard", "Speedometer KPI",
    "Network Connections", "Diamond Premium Value", "Hourglass Execution", "Flag on Mountain Peak",
    "Balance Scale Decision", "Globe Global Expansion", "Binoculars Forecast", "Financial Vault"
  ],
  ai: [
    "AI Brain with Circuit Tracks", "Microchip Processor Neural", "Robot Assistant Head", "Neural Network Nodes",
    "Chatbot Speech Bubble", "Facial Recognition Scan", "Machine Learning Flowchart", "Deep Learning Algorithm",
    "Automation Robotic Arm", "Voice Assistant Soundwave", "Smart Algorithm Cogwheel", "Quantum Computing Core",
    "Data Mining Funnel", "Predictive Analytics Chart", "Natural Language Processing", "Autonomous Drone",
    "Biometric Fingerprint AI", "Cyber Security Firewall", "Virtual Assistant Avatar", "Computer Vision Eye",
    "Automated Code Generation", "Machine Vision Scanner", "Smart IoT Sensor", "AI Cloud Server",
    "Intelligent Decision Tree", "Robotic Hand Gripping", "AI Document Scanning", "Smart Home Hub",
    "Algorithmic Trading Pulse", "Self-Driving Car Sensor", "Big Data Brain Cluster", "Supercomputer Tower"
  ],
  security: [
    "Padlock Locked Secure", "Shield with Checkmark", "Cyber Firewall Wall", "Keyhole Encrypted",
    "Biometric Fingerprint", "Facial ID Scanner", "Digital Key Card", "Two-Factor Auth Phone",
    "Safe Vault Steel Door", "Cloud Storage Lock", "Network Security Router", "Password Input Masked",
    "Hacker Mask Warning", "Bug Vulnerability Scanner", "Data Encryption Binary", "USB Hardware Key",
    "Security Camera CCTV", "Alarm Bell Alert", "Access Card Badge", "Secure Email Envelope",
    "SSL Certificate Seal", "Server Rack Shield", "Biometric Retina Scan", "Tamper Proof Seal",
    "Zero Trust Gateway", "Incident Response Siren", "File Protection Lock", "Credit Card Shield",
    "Identity Fraud Alert", "Backup Restore Disk", "VPN Tunnel Network", "Decryption Key Symbol"
  ],
  finance: [
    "Dollar Coin Stack", "Credit Card Chip", "Bank Building Pillar", "Wallet with Cash",
    "Upward Candlestick Chart", "Piggy Bank Savings", "Money Bag Sack", "Mobile Banking Transfer",
    "Safe Deposit Box", "Tax Calculator", "Invoice Receipt Paper", "Currency Exchange Arrows",
    "Investment Growth Plant", "Stock Market Bull", "Financial Growth Graph", "Gold Bullion Bars",
    "Contactless NFC Payment", "Bitcoin Crypto Token", "Security Vault Dial", "Revenue Percentage Sign",
    "Checkbook Register", "Real Estate Asset", "Retirement Nest Egg", "Loan Agreement Paper",
    "Wealth Management Diamond", "ATM Cash Dispenser", "Audit Checklist Pad", "Balance Sheet Ledger",
    "Donation Giving Hands", "Bonds Certificate", "Budget Pie Chart", "Venture Capital Rocket"
  ],
  health: [
    "Stethoscope Medical", "Heartbeat ECG Pulse", "Hospital Cross Emblem", "Caduceus Medical Staff",
    "Doctor Medical Bag", "Prescription Pill Bottle", "Syringe Vaccine Needle", "First Aid Emergency Kit",
    "DNA Double Helix Strand", "Microscope Lab Research", "Thermometer Fever", "Ambulance Vehicle",
    "Blood Drop Test", "Teeth Dental Care", "Eye Optical Vision", "Brain Neurology Scan",
    "Bandaid Adhesive", "IV Drip Bag Infusion", "Patient Medical Chart", "Telehealth Video Call",
    "Smartwatch Vitals", "Surgeon Scalpel Tool", "X-Ray Bone Radiography", "Shield Medical Insurance",
    "Capsule Medicine Pill", "Hand Sanitizer Pump", "Face Mask Protection", "Oxygen Cylinder",
    "Lungs Respiratory Care", "Wheelchair Mobility", "Medical Flask Beaker", "Heart with Care Hands"
  ],
  ecommerce: [
    "Shopping Cart Wheels", "Shopping Basket Wire", "Shopping Bag Handles", "Price Tag Discount",
    "Credit Card Payment", "Delivery Truck Van", "Cardboard Box Parcel", "Storefront Retail Shop",
    "Barcode Scanner Laser", "QR Code Mobile Scan", "Gift Box Ribbon", "Coupon Discount Voucher",
    "Wishlist Heart Favorite", "Customer Review Star", "Product Return Arrows", "Order Tracking Pin",
    "Wallet Cash Balance", "Mobile Shopping App", "Online Customer Chat", "Mega Sale Megaphone",
    "Secure Checkout Padlock", "Flash Sale Lightning", "Shopping Invoice Bill", "Clothing Hanger Fashion",
    "Package Box Tape", "Fast Shipping Clock", "Inventory Warehouse Shelf", "Click & Collect Hand",
    "POS Cash Register", "Currency Cashback Coin", "Product Comparison Scale", "Unboxing Happy Customer"
  ],
  logistics: [
    "Cargo Shipping Container", "Delivery Cargo Truck", "Air Freight Airplane", "Cargo Ship Vessel",
    "Forklift Warehouse Machine", "Cardboard Box Sealed", "Wooden Pallet Stacking", "Barcode Scanner Gun",
    "GPS Map Location Pin", "Delivery Scooter Courier", "Route Navigation Compass", "Warehouse Storage Depot",
    "Package Fragile Handle", "Hand Truck Dolly", "Conveyor Belt Automation", "Order Fulfilled Checkmark",
    "Supply Chain Network Links", "Fast Express Clock", "Customs Border Clearance", "Freight Train Wagon",
    "Unloading Crane Hook", "Package Tracking Smartphone", "Logistics Control Tower", "Return Merchandise Box",
    "Thermal Cold Chain Box", "Fleet Management Van", "Delivery Drone Quadcopter", "Signature Delivery Pad",
    "Safety Hard Hat Worker", "Weighing Scale Cargo", "Inventory Stock Shelves", "Global Logistics Globe"
  ]
};

// Generic fallback generation for any topic
export function generateSmartIcons(topicName: string): string[] {
  const clean = topicName.toLowerCase();
  
  for (const [key, icons] of Object.entries(THEME_KEYWORD_MAP)) {
    if (clean.includes(key)) {
      return icons;
    }
  }

  // Domain-specific keyword matching
  if (clean.includes("market") || clean.includes("brand") || clean.includes("advertis")) {
    return [
      "Bullhorn Megaphone", "Target Audience Dart", "Billboard Advertisement", "Social Media Campaign",
      "Email Marketing Envelope", "Conversion Funnel Lead", "Analytics Bar Chart", "Search Engine SEO Lens",
      "Pay-Per-Click Mouse", "Content Video Play", "Influencer Verified Star", "Viral Rocket Share",
      "Brand Identity Badge", "Customer Persona Avatar", "Discount Price Tag", "A/B Testing Split",
      "Newsletter Subscription", "Ad Banner Display", "ROI Dollar Graph", "Retargeting Loop Arrow",
      "Broadcast Antenna", "Brand Story Book", "Press Release Microphone", "Engagement Like Heart",
      "Lead Magnet Attract", "Affiliate Network Links", "Call-to-Action Click", "Traffic Growth Trend",
      "Market Survey Clipboard", "Podcast Audio Wave", "Customer Retention Anchor", "Global Reach World"
    ];
  }

  if (clean.includes("cloud") || clean.includes("server") || clean.includes("infra")) {
    return [
      "Cloud Server Storage", "Database Cylinder Stack", "Network Router Gateway", "Data Center Server Rack",
      "Cloud Upload Arrow", "Cloud Download Arrow", "Encrypted Cloud Lock", "API Code Integration",
      "Virtual Machine Cluster", "Load Balancer Scale", "Cloud Backup Hard Drive", "Speed Fiber Cable",
      "DevOps Infinite Loop", "Kubernetes Container Wheel", "Microservices Puzzle", "Firewall Shield Network",
      "Server Uptime Clock", "Bandwidth Speedometer", "Disaster Recovery Flash", "Multi-Cloud Connectors",
      "Terminal Command Prompt", "Cloud Monitoring Pulse", "Web Hosting Domain", "Secure Tunnel VPN",
      "Cloud Migration Sync", "Server Maintenance Wrench", "Data Lake Wave", "Edge Computing Node",
      "Zero Downtime Gauge", "Private Cloud Key", "Distributed Node Mesh", "Cloud Cost FinOps Coin"
    ];
  }

  if (clean.includes("sustain") || clean.includes("green") || clean.includes("eco") || clean.includes("environment") || clean.includes("carbon")) {
    return [
      "Green Leaf Ecology", "Recycle Three Arrows", "Wind Turbine Generator", "Solar Panel Cell",
      "Electric Vehicle Car", "EV Charging Plug", "Water Droplet Pure", "Eco Lightbulb Sprout",
      "Planet Earth Green", "Zero Carbon Neutral Footprint", "Forest Tree Silhouette", "Clean Energy Battery",
      "Hydroelectric Dam Water", "Biodegradable Bag", "Organic Plant Pot", "Eco Friendly House",
      "Save Water Tap Faucet", "Thermal Heat Sun", "Bicycle Green Commute", "Smart Grid Powerline",
      "Air Quality Sensor", "Compost Waste Bin", "Geothermal Energy Earth", "Renewable Biomass Sprout",
      "Eco Certificate Seal", "Pollution Zero Smog Filter", "Green Office Leaf", "Sustainable Factory Chimney",
      "Circular Economy Cycle", "Energy Saving Star", "Climate Balance Scale", "Clean Ocean Wave"
    ];
  }

  if (clean.includes("human") || clean.includes("recruit") || clean.includes("employ") || clean.includes("hr") || clean.includes("talent")) {
    return [
      "Candidate Resume CV", "Magnifying Glass Talent Search", "Job Interview Handshake", "Employee ID Badge",
      "Team Collaboration Circle", "Career Ladder Promotion", "Recruitment Funnel Filter", "Online Video Interview",
      "Employee Wellness Heart", "Skill Training Graduation Cap", "Organizational Hierarchy Tree", "Performance Review Rating Star",
      "Contract Job Offer Letter", "Reward Trophy Bonus", "Work Life Balance Scale", "Remote Employee Laptop",
      "Diversity Inclusion People", "Time Clock Attendance", "Onboarding Welcome Box", "Talent Headhunter Target",
      "Office Desk Workspace", "Employee Benefit Health Cross", "Payroll Salary Envelope", "Staff Meeting Podium",
      "Employee Survey Feedback", "Mentor Guidance Compass", "Talent Retention Magnet", "Badge of Excellence",
      "Team Building Puzzle", "Referral Network Handshake", "Exit Interview Door", "Executive Leadership Crown"
    ];
  }

  // Dynamic contextual generator for any specialized topic
  const prefix = topicName.replace(/[0-9.]/g, '').trim();
  return [
    `${prefix} Core Concept`, `${prefix} Strategy Plan`, `${prefix} System Framework`, `${prefix} Digital Platform`,
    `${prefix} Mobile App Interface`, `${prefix} Analytics Dashboard`, `${prefix} Security Protection`, `${prefix} Cloud Integration`,
    `${prefix} Workflow Automation`, `${prefix} Performance Metric`, `${prefix} User Profile Account`, `${prefix} Communication Channel`,
    `${prefix} Document Report`, `${prefix} Global Network`, `${prefix} Smart Optimization`, `${prefix} Verification Checkmark`,
    `${prefix} Growth Scaling Trend`, `${prefix} Technology Tool`, `${prefix} Settings Configuration`, `${prefix} Collaboration Hub`,
    `${prefix} Target Achievement`, `${prefix} Process Optimization`, `${prefix} Financial Transaction`, `${prefix} Quality Assurance`,
    `${prefix} Data Synchronization`, `${prefix} Monitoring Alert`, `${prefix} Innovation Lab`, `${prefix} Smart Sensor Hub`,
    `${prefix} Support Helpdesk`, `${prefix} Compliance Shield`, `${prefix} Timeline Roadmap`, `${prefix} Premium Excellence Award`
  ];
}
