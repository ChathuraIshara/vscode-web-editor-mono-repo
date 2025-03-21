import React, { useEffect, useState, useRef } from "react";
import { TextField, Dropdown, Button, SidePanelBody, ProgressRing, Icon, Typography } from "@dharshi/ui-toolkit";
import styled from "@emotion/styled";
import { BallerinaRpcClient, useRpcContext } from "@dharshi/ballerina-rpc-client";
import { Member, Type, UndoRedoManager, VisualizerLocation, TypeNodeKind } from "@dharshi/ballerina-core";
import { RecordFromJson } from "../RecordFromJson/RecordFromJson";
import { RecordFromXml } from "../RecordFromXml/RecordFromXml";
import { RecordEditor } from "./RecordEditor";
import { EnumEditor } from "./EnumEditor";
import { UnionEditor } from "./UnionEditor";
import { ClassEditor } from "./ClassEditor";
import { TypeHelperContext } from "../Context";
import { TypeHelperCategory, TypeHelperItem, TypeHelperOperator } from "../TypeHelper";
import { includes } from "lodash";

namespace S {
    export const Container = styled(SidePanelBody)`
        display: flex;
        flex-direction: column;
        gap: 20px;
    `;

    export const Row = styled.div<{}>`
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        width: 100%;
    `;

    export const CategoryRow = styled.div<{ showBorder?: boolean }>`
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: flex-start;
        gap: 12px;
        width: 100%;
        margin-top: 8px;
        padding-bottom: 14px;
        border-bottom: ${({ showBorder }) => (showBorder ? `1px solid var(--vscode-welcomePage-tileBorder)` : "none")};
    `;

    export const CheckboxRow = styled.div<{}>`
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        width: 100%;
    `;

    export const Footer = styled.div<{}>`
        display: flex;
        gap: 8px;
        flex-direction: row;
        justify-content: flex-end;
        align-items: center;
        margin-top: 8px;
        width: 100%;
    `;
}


const EditRow = styled.div`
    display: flex;
    gap: 8px;
    align-items: flex-end;
    width: 100%;
`;

const InputWrapper = styled.div`
    position: relative;
    width: 100%;
    display: flex;
    gap: 8px;
    align-items: flex-start;
`;

const TextFieldWrapper = styled.div`
    flex: 1;
`;

const EditButton = styled(Button)`
    margin-top: 39px;
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 8px;
    margin-bottom: 2px; 
`;

const StyledButton = styled(Button)`
    font-size: 14px;
`;

const WarningText = styled(Typography)`
    color: var(--vscode-textLink-foreground);
    font-size: 12px;
    margin-top: 4px;
`;

const EditableRow = styled.div`
    display: flex;
    align-items: flex-start;
    width: 100%;
    flex-direction: column;
`;

interface TypeEditorProps {
    type?: Type;
    filePath?: string
    rpcClient: BallerinaRpcClient;
    onTypeChange: (type: Type) => void;
    newType: boolean;
    isGraphql?: boolean;
    typeHelper: {
        loading?: boolean;
        loadingTypeBrowser?: boolean;
        basicTypes: TypeHelperCategory[];
        operators: TypeHelperOperator[];
        typeBrowserTypes: TypeHelperCategory[];
        onSearchTypeHelper: (searchText: string, isType?: boolean) => void;
        onSearchTypeBrowser: (searchText: string) => void;
        onTypeItemClick: (item: TypeHelperItem) => Promise<string>;
    }
}

enum ConfigState {
    EDITOR_FORM,
    IMPORT_FROM_JSON,
    IMPORT_FROM_XML,
}

enum TypeKind {
    RECORD = "Record",
    ENUM = "Enum",
    CLASS = "Service Class",
    UNION = "Union"
}

const undoRedoManager = new UndoRedoManager();

// Add validation function
const isValidBallerinaIdentifier = (name: string): boolean => {
    // Ballerina identifiers must start with a letter or underscore
    // and can contain letters, digits, and underscores
    const regex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    return name.length > 0 && regex.test(name);
};

export function TypeEditor(props: TypeEditorProps) {
    console.log("===TypeEditorProps===", props);
    const { isGraphql, filePath } = props;
    const [selectedTypeKind, setSelectedTypeKind] = useState<TypeKind>(() => {
        if (props.type) {
            // Map the type's node kind to TypeKind enum
            const nodeKind = props.type.codedata.node;
            switch (nodeKind) {
                case "RECORD":
                    return TypeKind.RECORD;
                case "ENUM":
                    return TypeKind.ENUM;
                case "CLASS":
                    return TypeKind.CLASS;
                case "UNION":
                    return TypeKind.UNION;
                default:
                    return TypeKind.RECORD;
            }
        }
        return TypeKind.RECORD;
    });
    const [type, setType] = useState<Type>(() => {
        if (props.type) {
            return { ...props.type, filePath: filePath };
        }
        // Initialize with default type for new types
        const defaultType = {
            name: "",
            members: [] as Member[],
            editable: true,
            filePath: filePath,
            includes: [] as string[],
            metadata: {
                description: "",
                deprecated: false,
                readonly: false,
                label: ""
            },
            properties: {},
            codedata: {
                node: "RECORD" as TypeNodeKind
            }
        };
        return defaultType as unknown as Type;
    });
    const [visualizerLocation, setVisualizerLocation] = React.useState<VisualizerLocation>();
    const nameInputRefs = useRef<(HTMLElement | null)[]>([]);
    const [isNewType, setIsNewType] = useState<boolean>(props.newType);
    const nameInputRef = useRef<HTMLInputElement | null>(null);
    const [editorState, setEditorState] = useState<ConfigState>(ConfigState.EDITOR_FORM);
    const [nameError, setNameError] = useState<string>("");
    const [closedRecord, setClosedRecord] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState("");
    const { rpcClient } = useRpcContext();

    useEffect(() => {
        if (type && isNewType) {
            // Add a small delay to ensure the input is mounted
            setTimeout(() => {
                if (nameInputRef.current) {
                    nameInputRef.current.focus();
                    nameInputRef.current.select();
                }
            }, 100);
        }
    }, []);

    const handleTypeKindChange = (value: string) => {
        // Convert display name back to internal TypeKind
        let selectedKind: TypeKind;
        if (isGraphql) {
            switch (value) {
                case "Input Object":
                    selectedKind = TypeKind.RECORD;
                    break;
                case "Object":
                    selectedKind = TypeKind.CLASS;
                    break;
                default:
                    selectedKind = value as TypeKind;
            }
        } else {
            selectedKind = value as TypeKind;
        }

        setSelectedTypeKind(selectedKind);
        const typeValue = selectedKind === TypeKind.CLASS ? "CLASS" : selectedKind.toUpperCase();

        // Always create a new type with the selected kind
        setType((currentType) => ({
            ...currentType!,
            kind: typeValue,
            members: [] as Member[],
            codedata: {
                ...currentType!.codedata, // Check the location of the type
                node: typeValue.toUpperCase() as TypeNodeKind
            }
        }));
    };

    // Add a helper function to get the display label
    const getTypeKindLabel = (kind: TypeKind, isGraphql?: boolean): string => {
        if (isGraphql) {
            switch (kind) {
                case TypeKind.RECORD:
                    return "Input Object";
                case TypeKind.CLASS:
                    return "Object";
                default:
                    return kind;
            }
        }
        return kind;
    };

    const getAvailableTypeKinds = (isGraphql: boolean | undefined, currentType?: TypeKind): TypeKind[] => {
        if (isGraphql) {
            // For GraphQL mode, filter options based on current type
            if (currentType === TypeKind.RECORD) {
                return [TypeKind.RECORD, TypeKind.ENUM, TypeKind.UNION];
            } else if (currentType === TypeKind.CLASS) {
                return [TypeKind.CLASS, TypeKind.ENUM, TypeKind.UNION];
            } else {
                return [TypeKind.RECORD, TypeKind.CLASS, TypeKind.ENUM, TypeKind.UNION];
            }
        }
        // Return all options for non-GraphQL mode
        return Object.values(TypeKind);
    };

    const onTypeChange = async (type: Type) => {
        if (!isValidBallerinaIdentifier(type.name)) {
            setNameError("Invalid name.");
            return;
        }
        const name = type.name;
        // IF type nodeKind is CLASS then we call graphqlEndpoint
        // TODO: for TypeDiagram we need to give a generic class creation
        if (type.codedata.node === "CLASS") {
            const response = await props.rpcClient
                .getBIDiagramRpcClient()
                .createGraphqlClassType({ filePath: filePath, type, description: "" });

        } else {
            console.log(">>> type editor type: ", type)
            const response = await props.rpcClient
                .getBIDiagramRpcClient()
                .updateType({ filePath: filePath, type, description: "" });
        }
        props.onTypeChange(type);
    }

    const handleTypeImport = (types: Type[], isXml: boolean = false) => {
        const importType = types[0];
        importType.codedata = type.codedata;
        setType(importType);
        setEditorState(ConfigState.EDITOR_FORM);
    }

    const renderEditor = () => {
        if (editorState === ConfigState.IMPORT_FROM_JSON) {
            return null; // Handle JSON import
        }
        if (editorState === ConfigState.IMPORT_FROM_XML) {
            return null; // Handle XML import
        }

        switch (selectedTypeKind) {
            case TypeKind.RECORD:
                return (
                    <>
                        <RecordEditor
                            type={type}
                            isAnonymous={false}
                            onChange={setType}
                            isGraphql={isGraphql}
                            onImportJson={() => setEditorState(ConfigState.IMPORT_FROM_JSON)}
                            onImportXml={() => setEditorState(ConfigState.IMPORT_FROM_XML)}
                        />
                    </>
                );
            case TypeKind.ENUM:
                return (
                    <EnumEditor
                        type={type}
                        onChange={setType}
                    />
                );
            case TypeKind.UNION:
                return (
                    <UnionEditor
                        type={type}
                        onChange={setType}
                        rpcClient={props.rpcClient}
                    />
                );
            case TypeKind.CLASS:
                return (
                    <ClassEditor
                        type={type}
                        isGraphql={isGraphql}
                        onChange={setType}
                    />
                );
            default:
                return <div>Editor for {selectedTypeKind} type is not implemented yet</div>;
        }
    };

    const startEditing = () => {
        setTempName(type.name);
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setTempName("");
    };

    const editTypeName = async () => {
        if (!tempName || tempName === type.name) {
            cancelEditing();
            return;
        }

        try {
            await rpcClient.getBIDiagramRpcClient().renameIdentifier({
                fileName: type?.filePath,
                position: {
                    line: type.codedata.lineRange.startLine.line,
                    character: type.codedata.lineRange.startLine.offset
                },
                newName: tempName
            });

            setType({
                ...type,
                name: tempName,
                properties: {
                    ...type.properties,
                    name: {
                        ...type.properties["name"],
                        value: tempName
                    }
                }
            });

            cancelEditing();
        } catch (error) {
            console.error('Error renaming service class:', error);
        }
    };

    return (
        <TypeHelperContext.Provider value={props.typeHelper}>
            <S.Container>
                {!type ? (
                    <ProgressRing />
                ) : (
                    <div>
                        <S.CategoryRow>
                            {isNewType && (
                                <Dropdown
                                    id="type-selector"
                                    label="Type"
                                    value={getTypeKindLabel(selectedTypeKind, isGraphql)}
                                    items={getAvailableTypeKinds(isGraphql, selectedTypeKind).map((kind) => ({
                                        label: getTypeKindLabel(kind, isGraphql),
                                        value: getTypeKindLabel(kind, isGraphql)
                                    }))}
                                    onChange={(e) => handleTypeKindChange(e.target.value)}
                                />
                            )}
                            {!isNewType && !isEditing && !type.properties["name"].editable && (
                                <InputWrapper>
                                    <TextFieldWrapper>
                                        <TextField
                                            id={type.name}
                                            name={type.name}
                                            value={type.name}
                                            label={type?.properties["name"]?.metadata?.label}
                                            required={!type?.properties["name"]?.optional}
                                            description={type?.properties["name"]?.metadata?.description}
                                            readOnly={!type.properties["name"].editable}
                                        />
                                    </TextFieldWrapper>
                                    <EditButton appearance="icon" onClick={startEditing} tooltip="Rename">
                                        <Icon name="bi-edit" sx={{ width: 18, height: 18, fontSize: 18 }} />
                                    </EditButton>
                                </InputWrapper>
                            )}
                            {isEditing && (
                                <>
                                    <EditableRow>
                                        <EditRow>
                                            <TextFieldWrapper>
                                                <TextField
                                                    id={type.name}
                                                    label={type.properties["name"].metadata.label}
                                                    value={tempName}
                                                    onChange={(e) => setTempName(e.target.value)}
                                                    description={type.properties["name"].metadata.description}
                                                    required={!type.properties["name"].optional}
                                                    autoFocus
                                                />
                                            </TextFieldWrapper>
                                            <ButtonGroup>
                                                <StyledButton
                                                    appearance="secondary"
                                                    onClick={cancelEditing}
                                                >
                                                    Cancel
                                                </StyledButton>
                                                <StyledButton
                                                    appearance="primary"
                                                    onClick={editTypeName}
                                                    disabled={!tempName || tempName === type.name}
                                                >
                                                    Save
                                                </StyledButton>
                                            </ButtonGroup>
                                        </EditRow>

                                        <WarningText variant="body3">
                                            Note: Renaming will update all references across the project
                                        </WarningText>
                                    </EditableRow>

                                </>
                            )}
                            {isNewType && (
                                <TextFieldWrapper>
                                    <TextField
                                        label="Name"
                                        value={type.name}
                                        onChange={(e) => {
                                            setType({ ...type, name: e.target.value });
                                            setNameError("");  // Clear error when user types
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                onTypeChange(type);
                                            }
                                        }}
                                        onFocus={(e) => e.target.select()}
                                        ref={nameInputRef}
                                    />
                                </TextFieldWrapper>
                            )}
                        </S.CategoryRow>

                        {editorState === ConfigState.EDITOR_FORM &&
                            <>
                                {renderEditor()}
                                <S.Footer>
                                    <Button onClick={() => onTypeChange(type)}>Save</Button>
                                </S.Footer>
                            </>
                        }
                        {
                            editorState === ConfigState.IMPORT_FROM_JSON &&
                            <RecordFromJson
                                rpcClient={props.rpcClient}
                                filePathUri={filePath}
                                name={type.name}
                                onCancel={() => setEditorState(ConfigState.EDITOR_FORM)}
                                onImport={handleTypeImport}
                            />
                        }
                        {
                            editorState === ConfigState.IMPORT_FROM_XML &&
                            <RecordFromXml
                                rpcClient={props.rpcClient}
                                filePath={filePath}
                                name={type.name}
                                onCancel={() => setEditorState(ConfigState.EDITOR_FORM)}
                                onImport={handleTypeImport}
                            />
                        }
                    </div >
                )}
            </S.Container >
        </TypeHelperContext.Provider>
    );
}
