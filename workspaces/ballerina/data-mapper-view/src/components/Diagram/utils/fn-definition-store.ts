import { LinePosition } from "@dharshi/ballerina-core";
import {
    NodePosition,
    STNode,
    traversNode
} from "@dharshi/syntax-tree";
import { URI } from "vscode-uri";

import { IDataMapperContext } from "../../../utils/DataMapperContext/DataMapperContext";
import { getFnDefsForFnCalls } from "../../../utils/st-utils";
import { FunctionCallFindingVisitor } from "../visitors/FunctionCallFindingVisitor";
import { LangClientRpcClient } from "@dharshi/ballerina-rpc-client";

export interface FnDefInfo {
    fnCallPosition: LinePosition;
    fnDefPosition: NodePosition;
    fnName: string;
    fileUri: string,
    isExprBodiedFn?: boolean;
}

export class FunctionDefinitionStore {

    fnDefinitions: Map<LinePosition, FnDefInfo>
    static instance : FunctionDefinitionStore;

    private constructor() {
        this.fnDefinitions = new Map();
    }

    public static getInstance() {
        if (!this.instance){
            this.instance = new FunctionDefinitionStore();
        }
        return this.instance;
    }

    public async storeFunctionDefinitions(
        stNode: STNode,
        context: IDataMapperContext,
        langServerRpcClient: LangClientRpcClient) {

        this.fnDefinitions.clear();
        const fileUri = URI.parse(context.currentFile.path).toString();
        const visitor = new FunctionCallFindingVisitor();
        traversNode(stNode, visitor);

        const fnCallPositions = visitor.getFunctionCallPositions();

        await this.setFnDefinitions(fileUri, fnCallPositions, langServerRpcClient);
    }

    async setFnDefinitions(fileUri: string, fnCallPositions: LinePosition[], langServerRpcClient: LangClientRpcClient) {

        const fnDefs = await getFnDefsForFnCalls(fnCallPositions, fileUri, langServerRpcClient)

        for (const fnDef of fnDefs) {
            this.fnDefinitions.set(fnDef.fnCallPosition, fnDef)
        }
    }

    public getFnDefinitions(position : LinePosition) : FnDefInfo {
        for (const [key, value] of this.fnDefinitions) {
            if (key.line === position.line && key.offset === position.offset) {
                return value;
            }
        }
    }
}
