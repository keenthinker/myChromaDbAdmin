## Usage and features

The home screen consists currently of two main areas:

- Sidebar (left): displays a list of all available collections.
- Main panel (right): displays the dashboard, document lists, and configuration dialogs. 

Upon loading, the application defaults to the Dashboard, witch provides a high-level overview of the connected instance. 

![The myChromaDbAdmin start screen](./myChromaDbAdmin-01.png)

### Managing collections

To create a new collection use the **create collection** dialog.

![Image](./myChromaDbAdmin-02.png)

You can modify an existing collection to rename it or update its metadata.

**Please note:** *The distance function (space configuration) can only be set during creation. It cannot be changed once the collection has been created.*

![Image](./myChromaDbAdmin-02-edit.png)

### Viewing documents

When you select a collection from the sidebar, the main panel displays all documents within that collection.

![Image](./myChromaDbAdmin-05.png)

If the selected collection contains no data, the list will appear empty.

![Image](./myChromaDbAdmin-03.png)

### Adding and Editing Documents

Documents can be added manually to any collection. Please note that embeddings are generated automatically by the server; they cannot be manually specified or edited.

![Image](./myChromaDbAdmin-04.png)

Existing documents can be modified at any time. 

![Image](./myChromaDbAdmin-06.png)

### Navigation and error handling

The paging functionality allows you to navigate through all documents if a collection contains more than 10 entries.

![Image](./myChromaDbAdmin-07.png)

The following is an example of a populated dashboard showing an instance with multiple collections and documents:

![Image](./myChromaDbAdmin-09.png)

If an unexpected issue occurs - such as the Chroma instance becoming unavailable - an error message will be displayed. 

![Error message](./myChromaDbAdmin-10-error.png)

