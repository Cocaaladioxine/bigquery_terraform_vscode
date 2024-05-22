# BigQuery and Terraform Helper

This extension, a personal project, simplifies working with BigQuery and Terraform. Developed in my spare time, it aims to reduce repetitive tasks and streamline work processes at my job.

Inspired by ETL tools like Talend, it provides features to automate workflows, such as a "reverse schema" button. Although helpful, it has limitations, especially with complex Terraform code.

The extension's purpose is to:

- Automate tasks and reduce repetition
- Offer user-friendly features
- Address real needs based on colleague feedback

## Features

At the moment, the extension provides :

- List of Terraform Locals and Resources
- BQ Dry Run
- Move SQL from view definition to external file
- Move schema from table definition to external file
- Replace Terraform locals to their value in SQL File
- Reverse view schema, automatically adding the "definition" field (blank value)
- Generate a Select statement with all the fields, based on a json schema (right click in json file)
- Generate a Select Statement with all the fields, based on a table id (ctrl-shift-p > "BQTF - BQTF: Generate a select all from a table Id )
- Auto declare google_bigquery_table resource for a view from a sql query
- Auto declare google_bigquery_table resource for a table from a JSON Schema file 

The extension relies on the Google Cloud SDK and will utilize the BQ command.
To use it, you should have the SDK installed and set up properly, with your account connected and a billing project set.

The reason for choosing the BQ command over the libraries is that it can work with your personal account for connections and permissions.
The libraries, on the other hand, require a service account. Sometimes, your company might not allow a dedicated service account, which can complicate managing access permissions.
By using your personal account, the extension can function just like the bigquery console on the web.

Have a look at the features [here](features.md).

## Requirements

Latest Visual Studio Code 
Up to date and configured Google Cloud SDK.
Follow Google instructions to install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install-sdk)

Your must be able to run this command in a shell for the extension to work properly:

`bq show --format=prettyjson bigquery-public-data:bbc_news.fulltext`

## Extension Settings

This extension contributes the following settings:

- `bqtf.workspaces`: Set the terraform workspaces you'll be working with as an array
- `bqtf.defaultWorkspace`: set the default terraform workspace, as a string
- `bqtf.plantUmlConfig`: set the plantUml style, as a string, has default
- `bqtf.preferredViewLocation`: Sets the view wizard behavior, allowing you to store the declaration in [one, many] files. Choosing 'many' will create a dedicated `.tf` file for each resource.
- `bqtf.viewFile`: Sets the name of the view wizard target file when the preferred view location is set to 'one'.
- `bqtf.preferredTableLocation`: Sets the table wizard behavior, allowing you to store the declaration in [one, many] files. Choosing 'many' will create a dedicated `.tf` file for each resource.
- `bqtf.tableFile`: Sets the name of the table wizard target file when the preferred view location is set to 'one'.
- `bqtf.autoDataset`: if there's only one dataset declared, use it and don't ask when using view/table wizard
- `bqtf.tableSchemaDefinition`: Allows you to use whatever table schema declaration you want when using the table declaration Wizard. You can add functions (eg. replace) or use the templatefile function. Use the {{path}} notation for the file path auto-replacement
- `bqtf.partitionFilterOutsideDeclaration`: If selected, require_partition_filter will be declared as expected by the Google provider version >= 5.3. Starting with this version, the require_partition_filter argument is located outside the time_partitioning definition. Default to False (old behavior)."


Inactive at the moment : 
- `"bqtf.additionalFieldsFiles`:

## Known Issues and Limitations

Won't work with certains terraform features.
- do not detect modules (yet?)
- do not detect "variables"

Move Schema/SQL to file only works with following syntax : 
```
<<SQL
    my_query
SQL
```

## Release Notes


### 0.3.3

- fix unbundled module

### 0.3.2 / 0.3.1

- doc fixes, changelog update, and so.

### 0.3.0

- switch to hcl2-json-parser, an updated version of hcl2-parser
- fix schema generation
- publish code


**Enjoy!**
