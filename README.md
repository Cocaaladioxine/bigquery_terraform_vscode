# bigqueryhelper README


# bigquery-tf-vscode-ext

This extension is a personal project that aims at simplifying work involving BigQuery and Terraform. This extension was developed during my free time to address the challenges of repetitive tasks and streamline our processes at my job.

In our company, where BigQuery and Terraform are frequently utilized, I noticed a need for simplification. Drawing inspiration from familiar ETL tools like Talend and Stambia, I've incorporated features that aim to bring back that simplicity, just like the "reverse schema" button.

It's important to acknowledge that while the extension helps increasing efficiency, it does have its limitations. Handling intricate Terraform code, in particular, presents challenges.

The features incorporated are based on my own needs and feedback from colleagues who also face similar challenges.

In a nutshell, this extension intends to:

- Simplify Tasks: Reduce repetitive actions and automate processes

- Bring Back Ease: Incorporate intuitive features reminiscent of user-friendly ETL tools.

- Address Real Needs: Developed based on genuine feedback from colleagues to ensure practicality.

- Stay Realistic: While it has its limitations, it strives to offer practical solutions for everyday tasks.

## Features

At the moment, we have :

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
Up to date and configured Google Cloud SDK

## Extension Settings

This extension contributes the following settings:

* `bqtf.workspaces`: Set the terraform workspaces you'll be working with as an array
* `bqtf.defaultWorkspace`: set the default terraform workspace, as a string
* `bqtf.plantUmlConfig`: set the plantUml style, as a string, has default
- `bqtf.preferredViewLocation`: Sets the view wizard behavior, allowing you to store the declaration in [one, many] files. Choosing 'many' will create a dedicated `.tf` file for each resource.
- `bqtf.viewFile`: Sets the name of the view wizard target file when the preferred view location is set to 'one'.
- `bqtf.preferredTableLocation`: Sets the table wizard behavior, allowing you to store the declaration in [one, many] files. Choosing 'many' will create a dedicated `.tf` file for each resource.
- `bqtf.tableFile`: Sets the name of the table wizard target file when the preferred view location is set to 'one'.
* `bqtf.autoDataset`: if there's only one dataset declared, use it and don't ask when using view/table wizard

Inactive at the moment : 
* `"bqtf.additionalFieldsFiles`:

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

## TODO

- Finalize ESLint
- Clone HCL2-parser and upgrade to the latest @tmccombs/hcl2json
- Check if @tmccombs/hcl2json handles variables
- Think about the modules and how to handle them
- Declare a bigquery table from a schema

**Enjoy!**
