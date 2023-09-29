const vscode = require('vscode');
const axios = require("axios");

class ResourcesProvider {
    constructor(ConnectionData, FavoriteList, FilterType) {
        this.__connectionData = ConnectionData;
        this._favoriteList = FavoriteList;
        this._filterType = FilterType;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    async getChildren(element) {
        const ConnectionData = this.__connectionData;
        const FavoriteList = this._favoriteList;
        const FilterType = this._filterType ?? 'none';
        const FeedbackItems = [];

        console.log(`${ConnectionData.ServerEndpoint}:${ConnectionData.ServerPort}/info.json`)
        const response = await axios.get(`http://${ConnectionData.ServerEndpoint}:${ConnectionData.ServerPort}/info.json`);
        let ServerResources = response.data.resources;

        if (ServerResources.length >= 1) {
            
            // Server Info TODO: Add Server Infos
            // const ServerInfo = new vscode.TreeItem(response.data.vars['sv_projectName']);
            // ServerInfo.iconPath = new vscode.ThemeIcon('extensions-info-message');
            // ServerInfo.description = `v${response.data.vars['txAdmin-version']}`;
            // FeedbackItems.push(ServerInfo);

            // Favorites
            FavoriteList.forEach((resource) => {
                ServerResources.splice(ServerResources.indexOf(resource), 1);

                const ResourceItem = new vscode.TreeItem(resource);
                ResourceItem.iconPath = new vscode.ThemeIcon('flame');
                FeedbackItems.push(ResourceItem);    
            });

            // Filter
            if (FilterType == 'Alphabetic') ServerResources = ServerResources.sort((a, b) => a.localeCompare(b));
            if (FilterType == 'Length') ServerResources = ServerResources.sort((a, b) => a.length - b.length);

            ServerResources.forEach((resource) => {
                const ResourceItem = new vscode.TreeItem(resource);
                ResourceItem.iconPath = new vscode.ThemeIcon('file');
                FeedbackItems.push(ResourceItem);    
            })
        } else {
            const NoResourcesFound = new vscode.TreeItem('No Resources Found');
            NoResourcesFound.iconPath = new vscode.ThemeIcon('private-ports-view-icon');
            FeedbackItems.push(NoResourcesFound);
        };
            
        return FeedbackItems;
    }

    getTreeItem(element) {
        return element
    }

}

module.exports = ResourcesProvider;