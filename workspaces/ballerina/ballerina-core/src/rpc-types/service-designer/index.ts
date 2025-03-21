
import { ListenerModelRequest, ListenerModelResponse, ServiceModelRequest, ServiceModelResponse, ServiceModelFromCodeRequest, ServiceModelFromCodeResponse, HttpResourceModelRequest, HttpResourceModelResponse, FunctionSourceCodeRequest, ListenerSourceCodeRequest, ListenersRequest, ListenersResponse, ServiceSourceCodeRequest, ListenerModelFromCodeRequest, ListenerModelFromCodeResponse, TriggerModelsRequest, TriggerModelsResponse, FunctionModelRequest, FunctionModelResponse } from "../../interfaces/extended-lang-client";
import {
    ExportOASRequest,
    ExportOASResponse,
    RecordSTRequest,
    RecordSTResponse,
    SourceUpdateResponse,
} from "./interfaces";

export interface ServiceDesignerAPI {
    getRecordST: (params: RecordSTRequest) => Promise<RecordSTResponse>;
    exportOASFile: (params: ExportOASRequest) => Promise<ExportOASResponse>;
    getTriggerModels: (params: TriggerModelsRequest) => Promise<TriggerModelsResponse>;
    getListeners: (params: ListenersRequest) => Promise<ListenersResponse>;
    getListenerModel: (params: ListenerModelRequest) => Promise<ListenerModelResponse>;
    addListenerSourceCode: (params: ListenerSourceCodeRequest) => Promise<SourceUpdateResponse>;
    updateListenerSourceCode: (params: ListenerSourceCodeRequest) => Promise<SourceUpdateResponse>;
    getListenerModelFromCode: (params: ListenerModelFromCodeRequest) => Promise<ListenerModelFromCodeResponse>;
    getServiceModel: (params: ServiceModelRequest) => Promise<ServiceModelResponse>;
    getFunctionModel: (params: FunctionModelRequest) => Promise<FunctionModelResponse>;
    addServiceSourceCode: (params: ServiceSourceCodeRequest) => Promise<SourceUpdateResponse>;
    updateServiceSourceCode: (params: ServiceSourceCodeRequest) => Promise<SourceUpdateResponse>;
    getServiceModelFromCode: (params: ServiceModelFromCodeRequest) => Promise<ServiceModelFromCodeResponse>;
    getHttpResourceModel: (params: HttpResourceModelRequest) => Promise<HttpResourceModelResponse>;
    addResourceSourceCode: (params: FunctionSourceCodeRequest) => Promise<SourceUpdateResponse>;
    addFunctionSourceCode: (params: FunctionSourceCodeRequest) => Promise<SourceUpdateResponse>;
    updateResourceSourceCode: (params: FunctionSourceCodeRequest) => Promise<SourceUpdateResponse>;
}
