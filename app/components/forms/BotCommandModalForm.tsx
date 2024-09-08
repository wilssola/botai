import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useEffect, useState } from "react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { Tag, WithContext as ReactTags } from "react-tag-input";
import {
  MAX_TAGS_INPUT_ARRAY_LENGTH,
  MAX_TAGS_INPUT_STRING_LENGTH,
} from "~/constants/validation";
import { Form } from "@remix-run/react";

export type BotCommandModalFormProps = {
  open: boolean;
  setOpen: () => void;
  mode: "create" | "update" | "delete";
  id?: string;
  sessionId?: string;
  name?: string;
  inputs?: string[];
  output?: string;
  enableAi?: boolean;
  promptAi?: string;
  priority?: number;
  subCommandIds?: string[];
};

export default function BotCommandModalForm(props: BotCommandModalFormProps) {
  const [enableAi, setEnableAi] = useState(props.enableAi);
  const [inputs, setInputs] = useState<Tag[]>([]);

  const handleDelete = (index: number) => {
    setInputs(inputs.filter((tag, _index) => _index !== index));
  };

  const onInputUpdate = (index: number, newTag: Tag) => {
    const updatedInputs = [...inputs];
    updatedInputs.splice(index, 1, newTag);
    setInputs(updatedInputs);
  };

  const handleAddition = (tag: Tag) => {
    setInputs([...inputs, tag]);
  };

  const handleDrag = (
    tag: Tag,
    currentPosition: number,
    newPosition: number
  ) => {
    const newTags = inputs.slice();

    newTags.splice(currentPosition, 1);
    newTags.splice(newPosition, 0, tag);

    setInputs(newTags);
  };

  const onClearAll = () => {
    setInputs([]);
  };

  useEffect(() => {
    if (props.open) {
      setEnableAi(props.enableAi ?? false);
      setInputs(
        props.inputs
          ? props.inputs.map((input) => ({ id: input, text: input }))
          : []
      );
    }
  }, [props.open, props.enableAi, props.inputs]);

  return (
    <Dialog open={props.open} onClose={props.setOpen} className="relative z-10">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-lg data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
          >
            <Form method="POST">
              {props.mode !== "delete" ? (
                <>
                  <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="sm:items-start">
                      <div className="mt-3 text-center sm:ml-2 sm:mr-2 sm:mt-0 sm:text-left">
                        <DialogTitle
                          as="h3"
                          className="text-base font-semibold leading-6 text-gray-900"
                        >
                          {props.mode === "create"
                            ? "Novo comando"
                            : "Editar comando"}
                        </DialogTitle>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            {props.id
                              ? "Edite o comando"
                              : "Crie um novo comando"}
                          </p>
                        </div>
                        <div className="mt-6 space-y-4 w-full">
                          <input
                            id="name"
                            name="name"
                            defaultValue={props.name}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 bg-gray-100"
                            placeholder="Nome do comando"
                            required
                          />
                          <input
                            id="inputs"
                            name="inputs"
                            type="hidden"
                            defaultValue={inputs.map((input) => input.text)}
                          />
                          <ReactTags
                            tags={inputs}
                            handleDelete={handleDelete}
                            handleAddition={handleAddition}
                            handleDrag={handleDrag}
                            onTagUpdate={onInputUpdate}
                            onClearAll={onClearAll}
                            inputFieldPosition="bottom"
                            autocomplete
                            editable
                            clearAll
                            classNames={{
                              tags: "grid items-center sm:text-sm",
                              tagInput: "flex sm:text-sm",
                              tagInputField:
                                "p-3 border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500 shadow-sm focus:ring-blue-500 sm:text-sm w-full bg-gray-100",
                              selected: "flex flex-wrap items-center mt-2",
                              tag: "bg-blue-500 text-white rounded-full px-3 py-1 mr-2 mt-1 mb-3 flex shadow-md items-center sm:text-sm",
                              remove:
                                "ml-2 cursor-pointer text-white sm:text-sm",
                              suggestions:
                                "absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 sm:text-sm",
                              activeSuggestion:
                                "bg-blue-500 text-white sm:text-sm",
                              editTagInput:
                                "sm:text-sm w-full p-3 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2 mb-2 w-full shadow-sm bg-gray-100",
                              editTagInputField: "w-full sm:text-sm",
                              clearAll:
                                "sm:text-sm text-gray-500 bg-red-500 rounded-md p-2 text-white ml-2 mr-2 min-w-fit",
                            }}
                            placeholder="Insira um comando e aperte Enter"
                            maxTags={MAX_TAGS_INPUT_ARRAY_LENGTH}
                            maxLength={MAX_TAGS_INPUT_STRING_LENGTH}
                          />
                          <textarea
                            id="output"
                            name="output"
                            defaultValue={props.output}
                            className="w-full resize-none rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 bg-gray-100"
                            placeholder="Resposta do comando"
                            draggable="false"
                            required
                          ></textarea>
                          <div className="flex items-center space-x-4">
                            <textarea
                              id="promptAi"
                              name="promptAi"
                              defaultValue={props.promptAi}
                              className="w-full resize-none rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 bg-gray-100"
                              placeholder="Prompt IA"
                              disabled={!enableAi}
                              draggable="false"
                            ></textarea>
                            <div className="flex items-center">
                              <input
                                id="enableAi"
                                name="enableAi"
                                type="checkbox"
                                checked={enableAi || false}
                                onChange={(e) => setEnableAi(e.target.checked)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <label
                                htmlFor="enableAi"
                                className="ml-2 block text-sm text-gray-900"
                              >
                                Habilitar IA
                              </label>
                            </div>
                          </div>
                          <input
                            id="priority"
                            name="priority"
                            type="number"
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 bg-gray-100"
                            placeholder="Prioridade"
                            min="0"
                            defaultValue={props.priority ?? 0}
                            required
                          />
                          {/*<textarea
                            id="subCommands"
                            name="subCommands"
                            defaultValue={props.subCommandIds}
                            className="w-full resize-none rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 bg-gray-100"
                            placeholder="Subcomandos"
                            draggable="false"
                          />*/}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                      type="submit"
                      data-autofocus="true"
                      className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto ${
                        props.mode === "create"
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-amber-500 hover:bg-amber-600"
                      }`}
                    >
                      {props.mode === "create" ? "Criar" : "Atualizar"}
                    </button>
                    <button
                      type="button"
                      onClick={props.setOpen}
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    >
                      Cancelar
                    </button>
                  </div>
                  <input
                    id="mode"
                    name="mode"
                    defaultValue={props.mode}
                    hidden
                  />
                  <input id="id" name="id" defaultValue={props.id} hidden />
                  <input
                    id="sessionId"
                    name="sessionId"
                    defaultValue={props.sessionId}
                    hidden
                  />
                </>
              ) : (
                <>
                  <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                        <DialogTitle
                          as="h3"
                          className="text-base font-semibold leading-6 text-gray-900"
                        >
                          Deletar Comando
                        </DialogTitle>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Tem certeza que deseja deletar este comando?
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                      type="submit"
                      className="inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm bg-red-500 hover:bg-red-600 sm:ml-3 sm:w-auto"
                    >
                      Deletar
                    </button>
                    <button
                      type="button"
                      data-autofocus="true"
                      onClick={() => props.setOpen()}
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    >
                      Cancelar
                    </button>
                  </div>
                  <input
                    id="mode"
                    name="mode"
                    defaultValue={props.mode}
                    hidden
                  />
                  <input id="id" name="id" defaultValue={props.id} hidden />
                </>
              )}
            </Form>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
