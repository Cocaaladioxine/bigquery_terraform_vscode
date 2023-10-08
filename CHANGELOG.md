# Change Log

All notable changes to the "bigqueryhelper" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Releases]

### 0.1.8

Change the Locals parser to hcl2-parser
Display a message if hcl2-parser fails to parse the locals.

### 0.1.9

Better handling of settings.json variables.
    - Emit alert message if not present
    - Emit different messages if workspace list or default workspace not present
Set an empty string as workspace if absent from settings.json

### 0.2.0

- Switch to HCL2-Parser for resources.
- Gives a bit shorter code base.
- ESLint 99% of the code
New functionality :
- Generate a Select statement with all the fields, based on a json schema (right click in json file)
- Generate a Select Statement with all the fields, based on a table id (ctrl-shift-p > "BQTF - BQTF: Generate a select all from a table Id )

### 0.2.1
Cleaning up "Todo's"
- simplify Resource interface, remove 'file'
- fixed a bug when generating plantUML file

### 0.2.2

- improved unix* compatibility (no more "C:" in the code)
- Wizards : 
    - Auto declare terraform code for a view from a sql query
    - Auto declare google_bigquery_table for a table from a JSON Schema file 
- Ignore subdirectories when looking for resources and locals => Prepare compliance with modules
- Two different kind of resources may have the same name
- Improved README.md
- Added a features.md

### 0.2.3

- fixed a bug concerning paths on *nix os