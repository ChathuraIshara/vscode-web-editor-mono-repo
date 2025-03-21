
import { RefObject } from "react";
import { DiagnosticMessage, FormDiagnostics, TextEdit, PropertyModel, LinePosition, LineRange  } from "@dharshi/ballerina-core";
import { ParamConfig } from "../ParamManager/ParamManager";
import { CompletionItem, FormExpressionEditorRef, HelperPaneOrigin } from "@dharshi/ui-toolkit";

export type FormValues = {
    [key: string]: any;
};

export type FormField = {
    key: string;
    label: string;
    type: null | string;
    optional: boolean;
    advanced?: boolean;
    editable: boolean;
    placeholder?: string;
    documentation: string;
    value: string | any[];
    valueType?: string;
    diagnostics?: DiagnosticMessage[];
    items?: string[];
    choices?: PropertyModel[];
    paramManagerProps?: ParamConfig;
    valueTypeConstraint: string | string[];
    groupNo?: number;
    groupName?: string;
    addNewButton?: boolean;
    enabled?: boolean;
    lineRange?: LineRange;
};

export type ParameterValue = {
    value: {
        variable: { value: string };
        type: { value: string };
    };
};

export type ExpressionFormField = {
    key: string;
    value: string;
    cursorPosition: LinePosition;
    isConfigured?: boolean
};

export type HelperPaneCompletionItem = {
    label: string;
    type?: string;
    insertText: string;
    kind?: string;
    codedata?: any;
}

export type HelperPaneCompletionCategory = {
    label: string;
    items: HelperPaneCompletionItem[];
}

export type HelperPaneVariableInfo = {
    category: HelperPaneCompletionCategory[];
}

export type HelperPaneFunctionCategory = {
    label: string;
    items?: HelperPaneCompletionItem[];
    subCategory?: HelperPaneFunctionCategory[];
}

export type HelperPaneFunctionInfo = {
    category: HelperPaneFunctionCategory[];
}

export type HelperPaneData = HelperPaneVariableInfo | HelperPaneFunctionInfo;

type FormCompletionConditionalProps = {
    completions: CompletionItem[];
    triggerCharacters: readonly string[];
    retrieveCompletions: (
        value: string,
        key: string,
        offset: number,
        triggerCharacter?: string,
        onlyVariables?: boolean
    ) => Promise<void>;
    extractArgsFromFunction?: (
        value: string,
        key: string,
        cursorPosition: number
    ) => Promise<{
        label: string;
        args: string[];
        currentArgIndex: number;
    }>;
} | {
    completions?: never;
    triggerCharacters?: never;
    retrieveCompletions?: never;
    extractArgsFromFunction?: never;
}

type FormTypeConditionalProps = {
    types: CompletionItem[];
    retrieveVisibleTypes: (value: string, cursorPosition: number) => Promise<void>;
} | {
    types?: never;
    retrieveVisibleTypes?: never;
}

type FormHelperPaneConditionalProps = {
    getHelperPane: (
        exprRef: RefObject<FormExpressionEditorRef>,
        defaultValue: string,
        value: string,
        onChange: (value: string, updatedCursorPosition: number) => void,
        changeHelperPaneState: (isOpen: boolean) => void,
    ) => JSX.Element;
    helperPaneOrigin?: HelperPaneOrigin;
} | {
    getHelperPane?: never;
    helperPaneOrigin?: never;
}

type FormExpressionEditorBaseProps = {
    getExpressionEditorDiagnostics?: (
        showDiagnostics: boolean,
        expression: string,
        key: string
    ) => Promise<void>;
    getExpressionFormDiagnostics?: (
        showDiagnostics: boolean,
        expression: string,
        key: string,
        setDiagnosticsInfo: (diagnostics: FormDiagnostics) => void,
        shouldUpdateNode?: boolean,
        variableType?: string
    ) => Promise<void>;
    onCompletionItemSelect?: (value: string, additionalTextEdits?: TextEdit[]) => Promise<void>;
    onFocus?: () => void | Promise<void>;
    onBlur?: () => void | Promise<void>;
    onCancel?: () => void;
    onSave?: (value: string) => void | Promise<void>;
    onRemove?: () => void;
    onSaveConfigurables?: (values: any) => void;
}

export type FormExpressionEditorProps =
    FormCompletionConditionalProps &
    FormTypeConditionalProps &
    FormHelperPaneConditionalProps &
    FormExpressionEditorBaseProps;
