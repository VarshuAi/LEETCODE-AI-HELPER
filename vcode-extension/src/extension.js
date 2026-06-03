const vscode = require('vscode');
const WelcomeProvider = require('./welcomeProvider');
const SidebarProvider = require('./sidebarProvider');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Activating Antigravity IDE Companion extension...');

    // Welcome Panel Provider
    const welcomeProvider = new WelcomeProvider(context);

    // Sidebar View Provider
    const sidebarProvider = new SidebarProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('antigravity-gemini-chat', sidebarProvider)
    );

    // Command: Open Welcome Screen
    let openWelcomeCmd = vscode.commands.registerCommand('antigravity.openWelcome', () => {
        welcomeProvider.show();
    });
    context.subscriptions.push(openWelcomeCmd);

    // Command: Configure Gemini API Key
    let configureApiKeyCmd = vscode.commands.registerCommand('antigravity.configureApiKey', async () => {
        const config = vscode.workspace.getConfiguration('antigravity');
        const currentKey = config.get('geminiApiKey') || '';
        
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your Google Gemini API Key',
            placeHolder: 'e.g. AIzaSy...',
            value: currentKey,
            ignoreFocusOut: true,
            password: true
        });

        if (apiKey !== undefined) {
            await config.update('geminiApiKey', apiKey, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage('Antigravity IDE Gemini API Key updated successfully!');
        }
    });
    context.subscriptions.push(configureApiKeyCmd);

    // Command: Apply Carbon Slate Theme
    let applyThemeCmd = vscode.commands.registerCommand('antigravity.applyTheme', async () => {
        const workbenchConfig = vscode.workspace.getConfiguration('workbench');
        await workbenchConfig.update('colorTheme', 'Antigravity Carbon Slate', vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage('Welcome to Antigravity IDE! Carbon Slate Theme applied.');
    });
    context.subscriptions.push(applyThemeCmd);

    // Command: Apply macOS Dark Theme
    let applyMacThemeCmd = vscode.commands.registerCommand('antigravity.applyMacTheme', async () => {
        const workbenchConfig = vscode.workspace.getConfiguration('workbench');
        await workbenchConfig.update('colorTheme', 'Antigravity macOS Dark', vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage('Welcome to Antigravity IDE! macOS Dark Theme applied.');
    });
    context.subscriptions.push(applyMacThemeCmd);

    // Automatically trigger Welcome Screen on first startup
    const welcomeStateKey = 'antigravity.welcomeScreenShown';
    const hasWelcomeBeenShown = context.globalState.get(welcomeStateKey);
    if (!hasWelcomeBeenShown) {
        vscode.commands.executeCommand('antigravity.openWelcome');
        context.globalState.update(welcomeStateKey, true);
    }
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
