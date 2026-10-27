// Mock knowledge base and project terminology data for frontend demonstration
// These are demo values — capturing domain terms, acronyms, and project conventions

export const mockTerminology = {
  'proj-001': [
    {
      term: 'CS',
      expansion: 'Carbon Steel',
      discipline: 'Piping',
      definition: 'Standard carbon steel piping specification (ASTM A106 Grade B). Common in process fluid transfer lines.',
      aliases: ['CS Pipe', 'Carbon St.', 'C-Steel'],
      usageCount: 142,
    },
    {
      term: 'SS',
      expansion: 'Stainless Steel',
      discipline: 'Piping',
      definition: 'Austenitic stainless steel specification (ASTM A312 TP304/316L) used for corrosive service streams.',
      aliases: ['SS Pipe', 'Stainless', '304SS', '316SS'],
      usageCount: 89,
    },
    {
      term: 'UG',
      expansion: 'Underground',
      discipline: 'Piping / Civil',
      definition: 'Below-grade piping, conduits, or trenching. Requires distinct safety clearances and backfill procedures.',
      aliases: ['Underground', 'Buried', 'Sub-grade'],
      usageCount: 54,
    },
    {
      term: 'AG',
      expansion: 'Above Ground',
      discipline: 'Piping / Structural',
      definition: 'Above-ground piping on sleepers, pipe racks, or equipment nozzles.',
      aliases: ['Above Ground', 'Elevated', 'Overhead'],
      usageCount: 110,
    },
    {
      term: 'Tie-in',
      expansion: 'Mechanical Connection Point',
      discipline: 'Piping',
      definition: 'Physical connection between newly erected piping/equipment and the operating refinery battery limit.',
      aliases: ['Tie-in Point', 'TP', 'Hot Tap', 'Cold Tie-in'],
      usageCount: 37,
    },
    {
      term: 'RFI',
      expansion: 'Request For Information',
      discipline: 'Project Controls',
      definition: 'Formal query directed from construction engineering to engineering design consultant.',
      aliases: ['Technical Query', 'TQ', 'Engineering Clarification'],
      usageCount: 63,
    },
    {
      term: 'Spool',
      expansion: 'Fabricated Pipe Spool',
      discipline: 'Piping',
      definition: 'Prefabricated segment of pipe with flanges/fittings assembled in fabrication shop and delivered to site.',
      aliases: ['Pipe Spool', 'Fabricated Spool'],
      usageCount: 95,
    },
  ],
  'proj-002': [
    {
      term: 'VS',
      expansion: 'Valve Station',
      discipline: 'Mechanical',
      definition: 'Automated block valve skid installed along mainline pipeline sections.',
      aliases: ['Valve Station', 'Block Valve', 'MLV'],
      usageCount: 48,
    },
    {
      term: 'ROW',
      expansion: 'Right of Way',
      discipline: 'Civil',
      definition: 'Designated legal corridor cleared for pipeline ditching and stringing.',
      aliases: ['Right of Way', 'Corridor', 'Pipeline Strip'],
      usageCount: 72,
    },
  ],
  'proj-003': [
    {
      term: 'CWS',
      expansion: 'Cooling Water System',
      discipline: 'Utilities',
      definition: 'Closed-loop circulating water network providing cooling for turbine condensers.',
      aliases: ['Cooling Water', 'CW System'],
      usageCount: 34,
    },
  ],
};

export const mockKnowledgeArticles = {
  'proj-001': [
    {
      id: 'kb-001',
      title: 'Piping Field Installation Verification Protocol',
      category: 'Best Practices',
      discipline: 'Piping',
      author: 'John Mitchell',
      updatedAt: '2026-09-15',
      summary: 'Guidelines for verifying daily installed piping quantities against isometric drawings and schedule WBS L6 activities.',
      content: `### 1. Scope
This protocol governs the verification of linear meters installed for carbon steel (CS) and stainless steel (SS) spools across Process Plant Units A, B, and C.

### 2. Evidence Requirements
Each daily report entry must cite:
- Line number from isometric drawing (e.g., \`10"-CS-0101-150#\`)
- Erected length in linear meters
- Weld inspection status (visual, NDT clearance)

### 3. Schedule Alignment
All 10-inch CS pipeline work in Unit A links to L6-101. Work in Unit B links to L6-102. Never record partial installation without specifying spool IDs.`,
      tags: ['Piping', 'Verification', 'L6-101', 'QA/QC'],
    },
    {
      id: 'kb-002',
      title: 'Concrete Pour Weather Criteria & Cure Delays',
      category: 'Standard Specs',
      discipline: 'Civil',
      author: 'Sarah Chen',
      updatedAt: '2026-08-20',
      summary: 'Temperature and moisture constraints for equipment foundation concrete pours to avoid rework and delay claims.',
      content: `### Constraints
- Minimum ambient temperature: 5°C
- Maximum ambient temperature without chiller water: 38°C
- 7-day compressive strength test required before equipment setting on Compressor House A foundation.`,
      tags: ['Civil', 'Concrete', 'Quality', 'Foundation'],
    },
    {
      id: 'kb-003',
      title: 'Substation Cable Tray Earthing & Routing Standards',
      category: 'Lessons Learned',
      discipline: 'Electrical',
      author: 'Ahmed Al-Rashid',
      updatedAt: '2026-07-10',
      summary: 'Lessons learned from Phase 1 substation installation regarding tray earthing continuity and tie-in sequencing.',
      content: `Ensure earthing bonding jumpers are installed concurrently with tray sections before high-voltage cable pulling commences to eliminate duplicate scaffolding mobilization.`,
      tags: ['Electrical', 'Substation', 'Safety', 'Lessons Learned'],
    },
  ],
  'proj-002': [
    {
      id: 'kb-101',
      title: 'Pipeline Ditching & Bedding Verification',
      category: 'Best Practices',
      discipline: 'Piping',
      author: 'Sarah Chen',
      updatedAt: '2026-09-01',
      summary: 'Verification standards for pipeline bedding material and trench depth.',
      content: `Verification procedure for pipeline bedding thickness and compaction testing before pipe lowering.`,
      tags: ['Pipeline', 'Bedding', 'Trenching'],
    },
  ],
  'proj-003': [
    {
      id: 'kb-201',
      title: 'Brownfield Tie-In Safety & Permit Protocol',
      category: 'Safety',
      discipline: 'Utilities',
      author: 'Ahmed Al-Rashid',
      updatedAt: '2026-08-12',
      summary: 'Required permit-to-work steps for live steam and cooling water system tie-ins.',
      content: `All brownfield tie-in operations require dual isolation, hot work permits, and gas testing prior to unbolting flanges.`,
      tags: ['Utilities', 'Safety', 'Brownfield', 'Tie-In'],
    },
  ],
};

export const hierarchyDefinitions = [
  { level: 'L1', name: 'Project / Program', description: 'Top-level capital investment project', example: 'ABC Refinery Expansion' },
  { level: 'L2', name: 'Sub-Project / Plant Area', description: 'Major facility or functional unit', example: 'Process Plant, Offsites & Utilities' },
  { level: 'L3', name: 'Discipline / Major System', description: 'Engineering and construction discipline', example: 'Piping, Civil & Structural, Electrical' },
  { level: 'L4', name: 'Area / Sub-System', description: 'Physical section or subsystem', example: 'Above Ground Piping, Equipment Foundations' },
  { level: 'L5', name: 'Work Package (CWP/EWP)', description: 'Contractor work package scope', example: 'Carbon Steel Pipeline Installation' },
  { level: 'L6', name: 'Field Activity / Task', description: 'Target tracking item matched with field reports', example: 'Install 10-inch CS Pipeline — Unit A' },
];
