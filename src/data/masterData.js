export const fallbackProjectMaster = {
  'WILL': [
    {
      parameter: 'Battery module',
      items: [
        'Battery pack',
        'Battery pack holder',
        'Battery pack screws',
        'Battery terminal wire connector',
        'Battery charger',
        'Battery cable',
      ],
    },
    {
      parameter: 'Operator module',
      items: [
        'Raspberry PI CM5',
        'RPI CM5 fan',
        'Waveshare CM5 pi5 connector board',
        '7inch IPS/QLED Integrated Display 1024 × 600',
        'Buzzer',
        '1.5M cable for tag',
        'Battery measuring device',
      ],
    },
    {
      parameter: 'Sensor node',
      items: ['Esp32 UWB sensor(Tag)', 'Esp32 UWB 3D case'],
    },
  ],
  'SV-30': [
    {
      parameter: 'Core Electronics',
      items: [
        'Raspberry Pi CM4 (8GB RAM, 32GB eMMC – SC0696B)',
        'Waveshare POE Box 4G Industrial IoT Mini-Computer',
        'SmartElex 5V 10A 2-Channel Relay Module',
        'SVPRO 8MP USB Camera (5–50mm Lens)',
        'Waveshare 7 Inch Capacitive HDMI LCD Display',
        'Cabinet Cooling Fan 120mm',
      ],
    },
    {
      parameter: 'Lighting',
      items: [
        '11-inch USB LED Panel Light Backlight with cable 1m',
        '20W DC 12V LED Flood Light | High Brightness Outdoor Flood Lamp Frontlight with cable 1m',
      ],
    },
    {
      parameter: 'Power & Protection',
      items: [
        'Bectro 6-Socket Extension Board',
        'Anchor 6A 3 Pin Plug Top (White)',
        '12V 5A Adapter (Pi)',
        '5V 1A Adapter (Back Light)',
        '12V 1.5A Adapter (Front Light)',
        '12V 1A Adapter (Fan)',
        '10A Double Pole MCB',
        'Surge Protector Type 1+2',
      ],
    },
    {
      parameter: 'Mechanical',
      items: [
        'DIN Mounting Rail (128.85mm × 35mm)',
        'male-to-Female LAN Connector',
        'LWC-CA-SMA-JACK-BH-ST-UFL-1.13mm RF Cable Assemblies-15cm',
        '4G LTE antenna',
        'Levelling Legs with nuts (12mm length, 8mm dia)',
        'PG19 Cable Gland',
        'Godrej Cam Lock',
      ],
    },
    {
      parameter: 'Cables & Connectors',
      items: [
        'HDMI Cable 1m (HMI)',
        'USB to Micro USB Cable 1m (HMI)',
        '4-Pin Connector: 10 cm long male connector and 20 cm female connector',
        'Red Insulated Ferrules Terminal Block Cord End Wire Connector 1mm',
        'XT60 Connector',
      ],
    },
    {
      parameter: 'Fasteners and Screws',
      items: [
        'Front Light: Normal Screw and nut along with washer: 6mm dia, 12mm length',
        'Back Panel: Allan Key Self Drilling: 4mm dia, 20mm length',
        'MCB: Allan Key Screw and nut along with washer: 6mm dia, 15mm length',
        'Fan: Allan Key Screw and nut along with washer: 4mm dia, 12mm length',
        'LAN Connector: Allan Key Screw and nut along with washer: 3mm dia, 12mm length',
        'Extension Board: Allan Key Screw and nut along with washer: 6mm dia, 55mm length',
      ],
    },
  ],
  VIGIL: [
    {
      parameter: 'Security Systems',
      items: ['Camera Module', 'Access Control Reader', 'Door Sensor', 'Network Switch'],
    },
    {
      parameter: 'Access Control',
      items: ['Biometric Gateway', 'RFID Controller', 'Emergency Exit Reader'],
    },
    {
      parameter: 'Perimeter',
      items: ['Fence Sensor', 'Motion Detector', 'Beacon Unit'],
    },
  ],
}

export const fallbackTransactions = [
  {
    id: 'TX-1048',
    project: 'SV-30',
    parameter: 'Core Electronics',
    item: 'Raspberry Pi CM4 (8GB RAM, 32GB eMMC – SC0696B)',
    amount: 42500,
    vendor: 'TechNest',
    date: '2026-09-02',
    status: 'Approved',
    invoiceStatus: 'Submitted',
    paymentStatus: 'Recorded',
    employee: 'Asha R.',
  },
  {
    id: 'TX-1049',
    project: 'VIGIL',
    parameter: 'Security Systems',
    item: 'Camera Module',
    amount: 31800,
    vendor: 'SecureLine',
    date: '2026-09-04',
    status: 'Pending',
    invoiceStatus: 'Pending',
    paymentStatus: 'Pending',
    employee: 'Karthik N.',
  },
  {
    id: 'TX-1050',
    project: 'WILL',
    parameter: 'Battery module',
    item: 'Battery pack',
    amount: 18400,
    vendor: 'BuildCare',
    date: '2026-09-05',
    status: 'Rejected',
    invoiceStatus: 'Missing',
    paymentStatus: 'Pending',
    employee: 'Meera V.',
    rejectionReason: 'Missing invoice reference',
  },
  {
    id: 'TX-1051',
    project: 'SV-30',
    parameter: 'Power & Protection',
    item: 'Surge Protector Type 1+2',
    amount: 67200,
    vendor: 'NetCore',
    date: '2026-09-06',
    status: 'Approved',
    invoiceStatus: 'Verified',
    paymentStatus: 'Partially Paid',
    employee: 'Rohit S.',
  },
]

export const fallbackInvoices = [
  { invoiceNumber: 'INV-2001', project: 'SV-30', amount: 42500, status: 'Verified' },
  { invoiceNumber: 'INV-2002', project: 'VIGIL', amount: 31800, status: 'Pending' },
  { invoiceNumber: 'INV-2003', project: 'WILL', amount: 18400, status: 'Rejected' },
]

export const fallbackPayments = [
  { paymentId: 'PY-1001', project: 'SV-30', amount: 24000, status: 'Paid' },
  { paymentId: 'PY-1002', project: 'VIGIL', amount: 14500, status: 'Pending' },
  { paymentId: 'PY-1003', project: 'WILL', amount: 18400, status: 'Recorded' },
]

export const fallbackAuditLogs = [
  { action: 'Transaction Submitted', user: 'Asha R.', entity: 'transactions', time: '2026-09-02 09:42' },
  { action: 'Transaction Approved', user: 'Naveen K.', entity: 'transactions', time: '2026-09-03 15:18' },
  { action: 'Invoice Uploaded', user: 'Asha R.', entity: 'invoices', time: '2026-09-04 08:10' },
]
