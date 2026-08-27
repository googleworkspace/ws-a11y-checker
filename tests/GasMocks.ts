/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Lightweight mock implementation of Google Apps Script CardService and Host APIs for Jest testing.
 */

export interface MockCardWidget {
  type: 'TextParagraph' | 'TextButton' | 'TextInput' | 'Image' | 'Divider';
  text?: string;
  fieldName?: string;
  title?: string;
  value?: string;
  hint?: string;
  action?: MockAction;
}

export interface MockAction {
  functionName: string;
  parameters: Record<string, string>;
}

export interface MockCardSection {
  header?: string;
  widgets: MockCardWidget[];
}

export interface MockCard {
  title?: string;
  sections: MockCardSection[];
}

export class MockCardBuilder {
  private card: MockCard = { sections: [] };

  setHeader(header: MockCardHeader): this {
    this.card.title = header.title;
    return this;
  }

  addSection(section: MockCardSectionBuilder): this {
    this.card.sections.push(section.buildSection());
    return this;
  }

  build(): MockCard {
    return this.card;
  }
}

export class MockCardHeader {
  title?: string;
  subtitle?: string;

  setTitle(title: string): this {
    this.title = title;
    return this;
  }

  setSubtitle(subtitle: string): this {
    this.subtitle = subtitle;
    return this;
  }
}

export class MockCardSectionBuilder {
  private section: MockCardSection = { widgets: [] };

  setHeader(header: string): this {
    this.section.header = header;
    return this;
  }

  addWidget(widget: any): this {
    if (widget && typeof widget.buildWidget === 'function') {
      this.section.widgets.push(widget.buildWidget());
    } else if (widget) {
      this.section.widgets.push(widget);
    }
    return this;
  }

  buildSection(): MockCardSection {
    return this.section;
  }
}

export class MockTextParagraph {
  private text: string = '';

  setText(text: string): this {
    this.text = text;
    return this;
  }

  buildWidget(): MockCardWidget {
    return { type: 'TextParagraph', text: this.text };
  }
}

export class MockTextButton {
  private text: string = '';
  private action?: MockAction;

  setText(text: string): this {
    this.text = text;
    return this;
  }

  setOnClickAction(action: MockActionBuilder): this {
    this.action = action.buildAction();
    return this;
  }

  buildWidget(): MockCardWidget {
    return { type: 'TextButton', text: this.text, action: this.action };
  }
}

export class MockTextInput {
  private fieldName: string = '';
  private title: string = '';
  private value: string = '';
  private hint: string = '';

  setFieldName(name: string): this {
    this.fieldName = name;
    return this;
  }

  setTitle(title: string): this {
    this.title = title;
    return this;
  }

  setValue(value: string): this {
    this.value = value;
    return this;
  }

  setHint(hint: string): this {
    this.hint = hint;
    return this;
  }

  buildWidget(): MockCardWidget {
    return {
      type: 'TextInput',
      fieldName: this.fieldName,
      title: this.title,
      value: this.value,
      hint: this.hint,
    };
  }
}

export class MockActionBuilder {
  private action: MockAction = { functionName: '', parameters: {} };

  setFunctionName(fn: string): this {
    this.action.functionName = fn;
    return this;
  }

  setParameters(params: Record<string, string>): this {
    this.action.parameters = { ...params };
    return this;
  }

  buildAction(): MockAction {
    return this.action;
  }
}

export class MockActionResponseBuilder {
  private nav: any;
  private notif: any;

  setNavigation(nav: any): this {
    this.nav = nav;
    return this;
  }

  setNotification(notif: any): this {
    this.notif = notif;
    return this;
  }

  build(): any {
    return { navigation: this.nav, notification: this.notif };
  }
}

export class MockNavigation {
  private card: any;

  updateCard(card: any): this {
    this.card = card;
    return this;
  }

  pushCard(card: any): this {
    this.card = card;
    return this;
  }

  getCard(): any {
    return this.card;
  }
}

export class MockNotification {
  private text: string = '';

  setText(text: string): this {
    this.text = text;
    return this;
  }

  getText(): string {
    return this.text;
  }
}

/**
 * Setup global Google Apps Script environment mocks in Jest runtime.
 */
export function setupGasEnvironment(options?: {
  userLocale?: string;
  userProperties?: Record<string, string>;
}): void {
  let activeLocale = options?.userLocale || 'en';
  let propertiesStore: Record<string, string> = options?.userProperties || {};

  (global as any).CardService = {
    newCardBuilder: () => new MockCardBuilder(),
    newCardHeader: () => new MockCardHeader(),
    newCardSection: () => new MockCardSectionBuilder(),
    newTextParagraph: () => new MockTextParagraph(),
    newTextButton: () => new MockTextButton(),
    newTextInput: () => new MockTextInput(),
    newAction: () => new MockActionBuilder(),
    newActionResponseBuilder: () => new MockActionResponseBuilder(),
    newNavigation: () => new MockNavigation(),
    newNotification: () => new MockNotification(),
    newAuthorizationException: () => ({
      setAuthorizationUrl: () => ({
        setResourceDisplayName: () => ({
          throwException: () => { throw new Error('Authorization required'); }
        })
      })
    })
  };

  (global as any).Session = {
    getActiveUserLocale: () => activeLocale,
    setActiveUserLocale: (loc: string) => { activeLocale = loc; },
    getActiveUser: () => ({ getEmail: () => 'user@example.com' }),
  };

  (global as any).PropertiesService = {
    getUserProperties: () => ({
      getProperties: () => ({ ...propertiesStore }),
      setProperties: (props: Record<string, string>) => {
        propertiesStore = { ...propertiesStore, ...props };
      },
      getProperty: (k: string) => propertiesStore[k] || null,
      setProperty: (k: string, v: string) => { propertiesStore[k] = v; },
      deleteAllProperties: () => { propertiesStore = {}; },
    }),
  };

  (global as any).ScriptApp = {
    AuthMode: { FULL: 'FULL', LIMITED: 'LIMITED', NONE: 'NONE' },
    AuthorizationStatus: { REQUIRED: 'REQUIRED', NOT_REQUIRED: 'NOT_REQUIRED' },
    getAuthorizationInfo: () => ({
      getAuthorizationStatus: () => 'NOT_REQUIRED',
      getAuthorizationUrl: () => 'https://accounts.google.com',
    }),
  };

  (global as any).Utilities = {
    base64Encode: (bytes: number[] | Uint8Array) => Buffer.from(bytes).toString('base64'),
    base64Decode: (str: string) => Array.from(Buffer.from(str, 'base64')),
  };
}

/**
 * Extracts all text contents from a MockCard.
 */
export function extractTextFromCard(card: MockCard): string[] {
  const texts: string[] = [];
  if (card.title) texts.push(card.title);
  for (const sec of card.sections || []) {
    if (sec.header) texts.push(sec.header);
    for (const w of sec.widgets || []) {
      if (w.text) texts.push(w.text);
      if (w.title) texts.push(w.title);
      if (w.hint) texts.push(w.hint);
    }
  }
  return texts;
}
