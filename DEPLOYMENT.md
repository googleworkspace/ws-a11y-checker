# Google Workspace Accessibility Checker: Institutional Deployment Guide

This guide provides step-by-step instructions for IT administrators, educational institutions, and enterprises to clone, build, and deploy the **Accessibility Checker** as an internal **Google Workspace Add-on** for all domain users across Google Docs, Google Slides, Google Sheets, and Gmail.

---

## 📑 Table of Contents

1. [Architecture & Deployment Model](#1-architecture--deployment-model)
2. [Prerequisites](#2-prerequisites)
3. [Step 1: Clone and Build the Repository](#step-1-clone-and-build-the-repository)
4. [Step 2: Create and Configure the Google Apps Script Project](#step-2-create-and-configure-the-google-apps-script-project)
5. [Step 3: Set Up the Google Cloud Platform (GCP) Project](#step-3-set-up-the-google-cloud-platform-gcp-project)
6. [Step 4: Configure OAuth Consent Screen](#step-4-configure-oauth-consent-screen)
7. [Step 5: Create a Versioned Deployment in Apps Script](#step-5-create-a-versioned-deployment-in-apps-script)
8. [Step 6: Configure & Publish via Google Workspace Marketplace SDK](#step-6-configure--publish-via-google-workspace-marketplace-sdk)
9. [Step 7: Domain-Wide Installation via Google Workspace Admin Console](#step-7-domain-wide-installation-via-google-workspace-admin-console)
10. [Step 8: Verification & User Testing](#step-8-verification--user-testing)
11. [Updating the Add-on to Future Versions](#updating-the-add-on-to-future-versions)
12. [Troubleshooting & Support](#troubleshooting--support)

---

## 1. Architecture & Deployment Model

The **Accessibility Checker** is designed as a self-contained, enterprise-grade Google Workspace Add-on:
- **Zero Third-Party Dependencies**: Runs directly within your institution's Google Apps Script environment and Google Cloud project. No document text or email contents are sent to external third-party services.
- **Private Domain-Wide Distribution**: Published internally via the Google Workspace Marketplace SDK so that only users within your institution's domain can access or install it.
- **Admin-Controlled Deployment**: Google Workspace administrators can automatically push the add-on to all domain users or target specific Organizational Units (OUs) and groups.

---

## 2. Prerequisites

Before starting the deployment process, ensure you have:

1. **Google Workspace Administrator Access** (Super Admin or Delegated Admin with rights to manage Marketplace apps).
2. **Google Cloud Console Access** with permissions to create and manage GCP projects in your organization.
3. **Node.js** (v18.0.0 or higher) and `npm` installed on your local machine.
4. **Google Clasp** installed globally:
   ```bash
   npm install -g @google/clasp
   ```
5. **Logged in to Clasp** using your administrative/developer account:
   ```bash
   clasp login
   ```
   > **Note:** Make sure the Google Apps Script API is enabled for your account at [script.google.com/home/usersettings](https://script.google.com/home/usersettings).

---

## Step 1: Clone and Build the Repository

1. Clone the source repository to your machine:
   ```bash
   git clone https://github.com/googleworkspace/ws-a11y-checker.git ws-a11y-checker
   cd ws-a11y-checker
   ```

2. Install root and UI dependencies:
   ```bash
   npm install
   ```

3. Run the automated unit test suite to verify code integrity:
   ```bash
   npm test
   ```
   *All 27 unit tests across Color Contrast, Alt Text, Hyperlinks, Table/Heading hierarchies, and Gmail Audits should pass.*

4. Build the production backend and frontend bundles:
   ```bash
   npm run build
   ```
   *This compiles the TypeScript backend (`dist/Code.js`), Angular 18 Zoneless UI (`dist/sidebar.html`), and manifest (`dist/appsscript.json`).*

---

## Step 2: Create and Configure the Google Apps Script Project

1. Create a new standalone Apps Script project in your Google account:
   ```bash
   npx clasp create --type standalone --title "Google Workspace Accessibility Checker" --rootDir dist
   ```
   *(If you already have an existing Apps Script project, ensure your `.clasp.json` contains its `scriptId` and has `"rootDir": "dist"`).*

2. Push the built bundle to Google Apps Script:
   ```bash
   npx clasp push --force
   ```

3. Open the project in the Apps Script online editor:
   ```bash
   npx clasp open
   ```

---

## Step 3: Set Up the Google Cloud Platform (GCP) Project

Google Workspace Add-ons require a standard Google Cloud Platform (GCP) project rather than a default Apps Script GCP project.

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new GCP project (e.g. `workspace-a11y-checker`) or select an existing institutional project under your Workspace organization.
3. Note your **Project Number** and **Project ID** from the Cloud Console dashboard.
4. **Enable Required APIs** in your GCP Project:
   - Navigate to **APIs & Services** → **Library**.
   - Search and enable each of the following:
     - **Google Workspace Marketplace SDK**
     - **Google Apps Script API**
     - **Google Slides API**
     - **Gmail API**
5. **Link the GCP Project to Apps Script**:
   - Return to your Google Apps Script project editor (`npx clasp open`).
   - Click **Project Settings** (gear icon ⚙️ on the left sidebar).
   - Under **Google Cloud Platform (GCP) Project**, click **Change project**.
   - Enter your GCP **Project Number** and click **Set project**.

---

## Step 4: Configure OAuth Consent Screen

1. In the [Google Cloud Console](https://console.cloud.google.com/), navigate to **APIs & Services** → **OAuth consent screen**.
2. Select **Internal** as the User Type (this restricts access strictly to accounts within your institution's Google Workspace domain and bypasses external Google app verification).
3. Click **Create** and complete the form:
   - **App name**: `Accessibility Checker`
   - **User support email**: Your institution's IT helpdesk or administrator email.
   - **App logo**: Upload the official accessibility icon (found in the repository assets or standard 128x128 PNG).
   - **Developer contact information**: Your IT administrator or developer email.
4. Click **Save and Continue**.
5. Under **Scopes**, click **Add or Remove Scopes** and ensure the following scopes required by `appsscript.json` are listed:
   - `https://mail.google.com/`
   - `https://www.googleapis.com/auth/documents.currentonly`
   - `https://www.googleapis.com/auth/presentations.currentonly`
   - `https://www.googleapis.com/auth/spreadsheets.currentonly`
   - `https://www.googleapis.com/auth/forms.currentonly`
   - `https://www.googleapis.com/auth/gmail.addons.current.action.compose`
   - `https://www.googleapis.com/auth/gmail.addons.execute`
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.compose`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/gmail.addons.current.message.readonly`
   - `https://www.googleapis.com/auth/gmail.addons.current.message.metadata`
   - `https://www.googleapis.com/auth/script.container.ui`
   - `https://www.googleapis.com/auth/script.external_request`
6. Click **Save and Continue** to finish the consent screen configuration.

---

## Step 5: Create a Versioned Deployment in Apps Script

1. In the Apps Script project editor, click **Deploy** → **New deployment** (top right).
2. Click the gear icon ⚙️ next to *Select type* and select **Google Workspace Add-on**.
3. Under **Configuration**:
   - **Description**: e.g., `Production v1.0 - Institutional Launch`
   - **Version**: Select `New version`.
4. Click **Deploy**.
5. Copy and save the **Deployment ID** generated in the confirmation dialog.

---

## Step 6: Configure & Publish via Google Workspace Marketplace SDK

1. In the Google Cloud Console, navigate to **APIs & Services** → **Google Workspace Marketplace SDK**.
2. Click **App Configuration**:
   - **App Visibility**: Select **Private** (Restricted to users in your domain/institution).
   - **Installation Settings**: Select **Individual + Admin Install** (allows both administrative force-installs and self-service installs).
   - **App Integration**:
     - Check **Google Workspace Add-on extension**.
     - Paste the **Deployment ID** copied in Step 5.
   - **Extensions**: Ensure checkboxes are selected for:
     - Docs
     - Slides
     - Sheets
     - Gmail
   - **Developer Info**: Fill in your team's developer name, website, and support email.
   - Click **Save**.
3. Click **Store Listing**:
   - Select default language (e.g. English).
   - **App Title**: `Accessibility Checker`
   - **Short Description**: `WCAG 2.1 AA accessibility scanner and automated remediation for Docs, Slides, Sheets, and Gmail.`
   - **Detailed Description**: Describe features, guidelines, and instructions for your institution's staff and students.
   - **Icons**:
     - 32x32 px app icon
     - 128x128 px app icon
   - **Category**: Select `Productivity` or `Education`.
   - **Privacy Policy URL** & **Terms of Service URL**: Provide links to your institution's internal IT policies or doc links.
   - Click **Publish**.

---

## Step 7: Domain-Wide Installation via Google Workspace Admin Console

Once published privately to your domain, you can distribute the add-on to all users across your institution:

1. Open the [Google Workspace Admin Console](https://admin.google.com/).
2. In the navigation menu, go to **Apps** → **Google Workspace Marketplace apps** → **Apps list**.
3. Click **Install app** (or **Admin Install**).
4. Select the **Internal Apps** tab or search for `Accessibility Checker`.
5. Click on the add-on and click **Admin Install** → **Continue**.
6. **Select Deployment Scope**:
   - **Everyone at [Your Institution Domain]** (installs for all faculty, staff, and students).
   - **Specific Organizational Units (OUs) or Groups** (e.g., pilot groups, specific departments).
7. Review and accept the data access permissions:
   - Check *"I agree to the application's Terms of Service and Privacy Policy"*.
8. Click **Finish**.

> **Tip:** Changes may take a few minutes to propagate across your Google Workspace domain. Users do not need to restart their browsers, but refreshing open Docs, Slides, or Gmail tabs will reveal the new add-on.

---

## Step 8: Verification & User Testing

Have a test user verify the add-on across each host application:

1. **Google Docs & Google Slides**:
   - Open any Google Doc or Google Slide deck.
   - Click **Extensions** → **Accessibility Checker** → **Open Accessibility Checker** (or click the Accessibility Checker icon in the right-hand companion sidebar).
   - Verify the audit dashboard loads and issues can be scanned and repaired.
2. **Gmail (Compose & Message Views)**:
   - Open Gmail.
   - Click **Compose** to draft a new email.
   - Click the **Accessibility Checker** icon in the bottom compose toolbar or side panel.
   - Verify draft audits, alt text inputs, and contrast checkers function smoothly.

---

## Updating the Add-on to Future Versions

When pulling updates or making changes to the codebase:

1. Pull the latest commits:
   ```bash
   git pull origin main
   ```
2. Run unit tests and rebuild:
   ```bash
   npm test
   npm run build
   ```
3. Push files to Apps Script:
   ```bash
   npx clasp push --force
   ```
4. Create a new deployment version:
   - In Apps Script: **Deploy** → **Manage deployments**.
   - Edit the active deployment, change version to **New version**, and click **Save**.
   *(Because the Deployment ID remains the same, your Google Workspace Marketplace listing updates automatically without requiring re-installation across the domain).*

---

## Troubleshooting & Support

| Symptom | Cause | Resolution |
| :--- | :--- | :--- |
| **"Script function not found"** | Deployment was made before running `npm run build` or files were pushed to wrong root. | Run `npm run build && npx clasp push --force`, then verify `dist/Code.js` contains the entry points. |
| **"Authorization required / Scope mismatch"** | Scopes in `appsscript.json` do not match GCP OAuth Consent Screen. | Ensure all 14 scopes in `appsscript.json` are added to the GCP OAuth Consent Screen in Step 4. |
| **"Add-on not appearing in Gmail compose"** | Gmail compose action permissions not granted. | Verify `appsscript.json` contains `gmail.composeTrigger` and re-authenticate the add-on. |
| **"App not found in Admin Console"** | Marketplace listing is not set to Private or has not finished publishing. | Check Marketplace SDK → *App Configuration* is set to **Private** and *Store Listing* status is **Published**. |

For additional questions or developer support, file an issue in the project repository or contact your institution's Google Workspace Administrator.
