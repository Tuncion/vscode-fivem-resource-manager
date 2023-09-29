const vscode = require('vscode');
const rcon = require("rcon");
const FeedbackProvider = require('./feedback.js');
const ResourcesProvider = require('./resources.js');

// Dynamic Vars
GlobalConnectionData = null;
GlobalFavoriteList = null;
GlobalFilterType = null;
RCONConnection = null;

function activate(context) {

    // Creator Command
    const CreatorCommand = vscode.commands.registerCommand('fivem-resource-manager.creator', async () => {
        const NotifySelection = await vscode.window.showInformationMessage('❤️ Thank you to use my extension', 'Repository', 'Creator');
      
        if (NotifySelection == 'Repository') {
            vscode.env.openExternal(vscode.Uri.parse("https://github.com/Tuncion/vscode-fivem-resource-manager"));
        } else if (NotifySelection == 'Creator') {
            vscode.env.openExternal(vscode.Uri.parse("https://github.com/Tuncion"));
        };  
    });

    // Contact Creator Command
    const ContactCreatorCommand = vscode.commands.registerCommand('fivem-resource-manager.contactCreator', async () => {
        vscode.env.openExternal(vscode.Uri.parse("https://github.com/Tuncion"));
        vscode.window.showWarningMessage('A browser window was opened...');
    });

    // Report Issue Command
    const ReportIssueCommand = vscode.commands.registerCommand('fivem-resource-manager.reportIssue', async () => {
        vscode.env.openExternal(vscode.Uri.parse("https://github.com/Tuncion/vscode-fivem-resource-manager/issues"));
        vscode.window.showWarningMessage('A browser window was opened...');
    });

    // Pull Request Command
    const CreatePullRequestCommand = vscode.commands.registerCommand('fivem-resource-manager.pullrequest', async () => {
        vscode.env.openExternal(vscode.Uri.parse("https://github.com/Tuncion/vscode-fivem-resource-manager/pulls"));
        vscode.window.showWarningMessage('A browser window was opened...');
    });

    // Get Started Command
    const GetStartedCommand = vscode.commands.registerCommand('fivem-resource-manager.getStarted', async () => {
        let ServerAddress = await vscode.window.showInputBox({ placeHolder: "ip:port", prompt: "Your server IPv4 with Port (blank for localhost)" });
        let ServerPassword = await vscode.window.showInputBox({ placeHolder: "password", password: true, prompt: "Your server RCON password" });
        if (!ServerAddress) ServerAddress = 'localhost:30120';
        if (!ServerPassword) return vscode.window.showWarningMessage('You have not set your server RCON password!');

        // Save in Workspace
        const ServerEndpoint = ServerAddress.split(':')[0] ?? ServerAddress;
        const ServerPort = Number(ServerAddress.split(':')[1] ?? 0);
        SetGlobalConnectionState({ServerEndpoint, ServerPort, ServerPassword});

        // Execute Connection
        vscode.commands.executeCommand('fivem-resource-manager.connect');

        // Info Message
        vscode.window.showInformationMessage(`Saved connection for endpoint ${ServerAddress}`);
    });

    // Connect Command
    const ConnectCommand = vscode.commands.registerCommand('fivem-resource-manager.connect', async () => {
        const ConnectionData = GlobalConnectionData;
        if (!ConnectionData) return vscode.commands.executeCommand('fivem-resource-manager.getStarted');
        if (RCONConnection) return vscode.window.showWarningMessage('Already connected');

        // Create RCON Connection
        const options = { tcp: false, challenge: false };
        RCONConnection = new rcon(ConnectionData.ServerEndpoint, ConnectionData.ServerPort, ConnectionData.ServerPassword, options);

        // Create Event Handler
        RCONConnection
        .on("auth", () => {
            console.log(`Authenticated with ${ConnectionData.ServerEndpoint} on port ${ConnectionData.ServerPort}`);
            SetConnectionState(true);
        })
        .on("response", (response) => {
            if (response.includes("Couldn't find resource")) {
                vscode.window.showWarningMessage("Couldn't find resource");
            } else if (response.includes('Invalid password')) {
                vscode.window.showWarningMessage("Invalid password");
                vscode.commands.executeCommand('fivem-resource-manager.resetConnection');
            };
        })
        .on("error", (err) => {
            vscode.window.showWarningMessage(`${err}`);
            SetConnectionState(false);
        })
        .on("end", () => {
            vscode.window.showWarningMessage("Connection closed");
            SetConnectionState(false);
        });

        // Connect to server
        RCONConnection.connect();
    });

    // Restart Resource Command
    const RestartResourceCommand = vscode.commands.registerCommand('fivem-resource-manager.restartResource', async (item) => {
        if (!RCONConnection) return console.log('not connected');
        if (!item) return console.log('Unknown item for restart resource');

        RCONConnection.send(`refresh; ensure ${item.label}`);
        vscode.window.showWarningMessage(`The resource ${item.label} was restarted`);
    });

    // Set Favorite Command
    const SetFavoriteCommand = vscode.commands.registerCommand('fivem-resource-manager.setFavorite', async (item) => {
        const FavoriteList = GlobalFavoriteList;

        if (FavoriteList.includes(item.label)) {
            FavoriteList.splice(FavoriteList.indexOf(item.label), 1);
        } else {
            FavoriteList.push(item.label);
        };

        SetGlobalFavoritesState(FavoriteList);
        vscode.commands.executeCommand('fivem-resource-manager.refreshResources');
    });

    // Refresh Command
    const RefreshResourcesCommand = vscode.commands.registerCommand('fivem-resource-manager.refreshResources', async () => {
        if (!GlobalConnectionData) return vscode.window.registerTreeDataProvider('fivem-resource-manager.resources', {getChildren: () => []});
        vscode.window.registerTreeDataProvider('fivem-resource-manager.resources', new ResourcesProvider(GlobalConnectionData, GlobalFavoriteList, GlobalFilterType));
    });

    // Filter Command
    const FilterResourcesCommand = vscode.commands.registerCommand('fivem-resource-manager.filterResources', async () => {
        const Options = ['None', 'Alphabetic', 'Length'];

        vscode.window.showQuickPick(Options, {
            placeHolder: 'Select an option'
        }).then(selectedOption => {
            if (selectedOption) {
                SetGlobalFilterState(selectedOption);
                vscode.commands.executeCommand('fivem-resource-manager.refreshResources');
            }
        })
    });

    // Reset Connection Command
    const ResetConnectionCommand = vscode.commands.registerCommand('fivem-resource-manager.resetConnection', async () => {
        vscode.window.showWarningMessage(`The connection was reset`);
        SetGlobalConnectionState(null);
        SetGlobalFavoritesState([]);
        SetGlobalFilterState('none');
        SetConnectionState(false);
        vscode.commands.executeCommand('fivem-resource-manager.refreshResources');
    });

    // Save data
    GlobalConnectionData = context.globalState.get('fivem-resource-manager.connection');
    GlobalFavoriteList = context.globalState.get('fivem-resource-manager.favorites') ?? [];
    GlobalFilterType = context.globalState.get('fivem-resource-manager.filter') ?? 'none';

    // Register Providers
    if (GlobalConnectionData) vscode.commands.executeCommand('fivem-resource-manager.connect');
    vscode.window.registerTreeDataProvider('fivem-resource-manager.helpandfeedback', new FeedbackProvider());

    // Push Subscriptions
    context.subscriptions.push(CreatorCommand, ContactCreatorCommand, ReportIssueCommand, CreatePullRequestCommand, GetStartedCommand, ConnectCommand, RestartResourceCommand, SetFavoriteCommand, RefreshResourcesCommand, FilterResourcesCommand, ResetConnectionCommand);

    /**
     * Sets the global connection state and updates the global state.
     * @param {any} value - The value to set the global connection state to.
     */
    function SetGlobalConnectionState (value) {
        GlobalConnectionData = value;
        context.globalState.update('fivem-resource-manager.connection', value);
    }
    
    /**
     * Sets the global favorite list state and updates the context global state.
     * @param {Array} value - The new value for the global favorite list.
     */
    function SetGlobalFavoritesState (value) {
        GlobalFavoriteList = value;
        context.globalState.update('fivem-resource-manager.favorites', value);
    }
    
    /**
     * Sets the global filter state and updates the context global state.
     * @param {string} value - The value to set the global filter state to.
     */
    function SetGlobalFilterState (value) {
        GlobalFilterType = value;
        context.globalState.update('fivem-resource-manager.filter', value);
    }
    
    /**
     * Sets the connection state and updates the UI accordingly.
     * 
     * @param {boolean} bool - The connection state to set.
     */
    function SetConnectionState (bool) {
        if (bool) {
            vscode.commands.executeCommand('setContext', 'fivem-resource-manager.connected', true);
            vscode.window.registerTreeDataProvider('fivem-resource-manager.resources', new ResourcesProvider(GlobalConnectionData, GlobalFavoriteList, GlobalFilterType));
        } else {
            vscode.commands.executeCommand('setContext', 'fivem-resource-manager.connected', false);
            RCONConnection = null;
        }
    }
}

function deactivate() {}


module.exports = {
	activate,
	deactivate
}