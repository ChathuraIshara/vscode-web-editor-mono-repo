
import React, { useEffect, useState } from 'react';
import { EVENT_TYPE, ListenerModel, NodePosition, LineRange } from '@dharshi/ballerina-core';
import { Typography, ProgressRing, View, ViewContent } from '@dharshi/ui-toolkit';
import styled from '@emotion/styled';
import { useRpcContext } from '@dharshi/ballerina-rpc-client';
import ListenerConfigForm from './Forms/ListenerConfigForm';
import { LoadingContainer } from '../styles';
import { TopNavigationBar } from '../../components/TopNavigationBar';
import { TitleBar } from '../../components/TitleBar';

const FORM_WIDTH = 600;

const FormContainer = styled.div`
    padding-top: 15px;
    padding-bottom: 15px;
`;


const ContainerX = styled.div`
    padding: 0 20px 20px;
    max-width: 600px;
    > div:last-child {
        padding: 20px 0;
        > div:last-child {
            justify-content: flex-start;
        }
    }
`;

const Container = styled.div`
    display: "flex";
    flex-direction: "column";
    gap: 10;
    margin: 0 20px 20px 0;
`;

const BottomMarginTextWrapper = styled.div`
    margin-top: 20px;
    margin-left: 20px;
    font-size: 15px;
    margin-bottom: 10px;
`;

const HorizontalCardContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`;

const IconWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

const ButtonWrapper = styled.div`
    max-width: 600px;
    display: flex;
    gap: 10px;
    justify-content: right;
`;


export interface ListenerEditViewProps {
    filePath: string;
    position: NodePosition;
}

export function ListenerEditView(props: ListenerEditViewProps) {
    console.log('listener edit view props: ', props)
    const { filePath, position } = props;
    const { rpcClient } = useRpcContext();
    const [listenerModel, setListenerModel] = useState<ListenerModel>(undefined);

    const [saving, setSaving] = useState<boolean>(false);

    useEffect(() => {
        const lineRange: LineRange = { startLine: { line: position.startLine, offset: position.startColumn }, endLine: { line: position.endLine, offset: position.endColumn } };
        rpcClient.getServiceDesignerRpcClient().getListenerModelFromCode({ filePath, codedata: { lineRange } }).then(res => {
            console.log("Editing Listener Model: ", res.listener)
            setListenerModel(res.listener);
        })
    }, [position]);

    const onSubmit = async (value: ListenerModel) => {
        setSaving(true);
        const res = await rpcClient.getServiceDesignerRpcClient().updateListenerSourceCode({ filePath, listener: value });
        await rpcClient.getVisualizerRpcClient().openView({
            type: EVENT_TYPE.OPEN_VIEW,
            location: {
                documentUri: res.filePath,
                position: res.position
            },
        });
        setSaving(false);
    }

    return (
        <View>
            <TopNavigationBar />
            <TitleBar title="Listener" subtitle="Edit Listener" />
            <ViewContent padding>
                {!listenerModel &&
                    <LoadingContainer>
                        <ProgressRing />
                        <Typography variant="h3" sx={{ marginTop: '16px' }}>Loading...</Typography>
                    </LoadingContainer>
                }
                {listenerModel &&
                    <Container>
                        {!saving &&
                            <>
                                <ListenerConfigForm listenerModel={listenerModel} onSubmit={onSubmit} formSubmitText={"Save"} />
                            </>
                        }
                        {saving &&
                            <LoadingContainer>
                                <ProgressRing />
                                <Typography variant="h3" sx={{ marginTop: '16px' }}>Saving... Please wait</Typography>
                            </LoadingContainer>
                        }
                    </Container>
                }
            </ViewContent>
        </View >


    );
};
