import "./Codes.css";

import { QueryCodesResponse } from "cosmjs-types/cosmwasm/wasm/v1/query";
import { QueryClient, toHex, WasmExtension } from "cosmwasm";
import React from "react";

import { ClientContext } from "../../contexts/ClientContext";
import {
  ErrorState,
  errorState,
  isErrorState,
  isLoadingState,
  LoadingState,
  loadingState,
} from "../../ui-utils/states";
import { Code, CodeData } from "./Code";

interface LoadedCode {
  readonly source: string;
  readonly data: CodeData;
}

function codeKey(code: LoadedCode): string {
  return `${code.source}__${code.data.codeId}`;
}

export function Codes(): JSX.Element {
  const { client, nodeUrl } = React.useContext(ClientContext);
  const [codes, setCodes] = React.useState<readonly LoadedCode[] | ErrorState | LoadingState>(loadingState);

  React.useEffect(() => {
    if (!client) return;

    // This is accessing private fields. The query client cannot be used directly.
    // This is unfortunate especially because CosmWasmClient.getCodes does not support pagination.
    // However, there is no better way available right now.
    const queryClient: QueryClient & WasmExtension = (client as any).forceGetQueryClient();

    (async () => {
      const all = [];

      try {
        let startAtKey: Uint8Array | undefined = undefined;
        do {
          const response: QueryCodesResponse = await queryClient.wasm.listCodeInfo(startAtKey);
          const { codeInfos, pagination } = response;
          const loadedCodes = (codeInfos || []).map(
            (entry): LoadedCode => ({
              source: nodeUrl,
              data: {
                codeId: entry.codeId.toNumber(),
                checksum: toHex(entry.dataHash),
                creator: entry.creator,
              },
            }),
          );
          loadedCodes.reverse();
          all.unshift(...loadedCodes);
          startAtKey = pagination?.nextKey;
        } while (startAtKey?.length !== 0);
      } catch (_e: any) {
        setCodes(errorState);
      }

      setCodes(all);
    })();
  }, [client, nodeUrl]);

  // Display codes vertically on small devices and in a flex container on large and above
  return (
    <div className="d-lg-flex flex-wrap">
      {isLoadingState(codes) ? (
        <p>Loading …</p>
      ) : isErrorState(codes) ? (
        <p>Error loading codes</p>
      ) : codes.length === 0 ? (
        <p>No code uploaded yet</p>
      ) : (
        codes.map((code, index) => <Code data={code.data} index={index} key={codeKey(code)} />)
      )}
    </div>
  );
}
