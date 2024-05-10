# Change Log

All notable changes to the "bigqueryhelper" extension will be documented in this file.

## [Releases]

### 0.3.2 / 0.3.1

- doc fixes, changelog update, and so.

### 0.3.0

- switch to hcl2-json-parser, an updated version of hcl2-parser
- fix schema generation
- publish code

### 0.2.5

- fix a bug that prevented to use the wizard on a table without date/datetime/timestamp field
- add and handle a config `bqtf.partitionFilterOutsideDeclaration`
- add and handle a config `bqtf.tableSchemaDefinition`

### 0.2.4

- Better objects locals detection and rejection

### 0.2.3

- fixed a bug concerning paths on *nix os

### 0.2.2

- Added a features.md
- Improved README.md
- Two different kind of resources may have the same name
- Ignore subdirectories when looking for resources and locals => Prepare compliance with modules
- improved unix* compatibility (no more "C:" in the code)
- Wizards:
  - Auto declare google_bigquery_table for a table from a JSON Schema file
  - Auto declare terraform code for a view from a sql query

### 0.2.1

- fixed a bug when generating plantUML file
- simplify Resource interface, remove 'file'
- Cleaning up "Todo's"

### 0.2.0

- Generate a Select Statement with all the fields, based on a table id (ctrl-shift-p > "BQTF - BQTF: Generate a select all from a table Id )
- Generate a Select statement with all the fields, based on a json schema (right click in json file)
- ESLint 99% of the code
- Gives a bit shorter code base.
- Switch to HCL2-Parser for resources.

### 0.1.9

Set an empty string as workspace if absent from settings.json
Better handling of settings.json variables.
  - Emit alert message if not present
  - Emit different messages if workspace list or default workspace not present

### 0.1.8

Display a message if hcl2-parser fails to parse the locals.
Change the Locals parser to hcl2-parser
