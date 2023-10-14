const vscode = require('vscode');

class FeedbackProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        const feedbackItems = [];

        // Get Started
        const GetStarted = new vscode.TreeItem('Get Started');
        GetStarted.iconPath = new vscode.ThemeIcon('star');
        GetStarted.command = {
            command: 'fivem-resource-manager.getStarted',
            title: 'Get Started'
        };
        feedbackItems.push(GetStarted);

        // Create Pull Request
        const CreatePullRequest = new vscode.TreeItem('Create Pull Request');
        CreatePullRequest.iconPath = new vscode.ThemeIcon('git-pull-request');
        CreatePullRequest.command = {
            command: 'fivem-resource-manager.pullrequest',
            title: 'Create Pull Request'
        };
        feedbackItems.push(CreatePullRequest);

        // Report Issue
        const ReportIssue = new vscode.TreeItem('Report Issue');
        ReportIssue.iconPath = new vscode.ThemeIcon('remote-explorer-report-issues');
        ReportIssue.command = {
            command: 'fivem-resource-manager.reportIssue',
            title: 'Report Issue'
        };
        feedbackItems.push(ReportIssue);

        // Creator
        const ContactCreator = new vscode.TreeItem('Contact Creator');
        ContactCreator.iconPath = new vscode.ThemeIcon('accounts-view-bar-icon');
        ContactCreator.command = {
            command: 'fivem-resource-manager.contactCreator',
            title: 'Contact Creator'
        };
        feedbackItems.push(ContactCreator);

        return feedbackItems;
    }
}

module.exports = FeedbackProvider;
