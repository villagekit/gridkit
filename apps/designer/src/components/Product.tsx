import '@villagekit/part-gridbeam'
import '@villagekit/part-gridpanel'

import React from 'react'
import {
  AssemblyInfo,
  Sandbox,
  useSandboxContext,
  DesignRenderError,
  DesignValidationErrors,
} from '@villagekit/sandbox'
import { Box, Flex, HStack, Heading, List, ListIcon, ListItem, VStack } from '@villagekit/ui'
import { Resplit } from 'react-resplit'
import { ParameterControls } from '@villagekit/parameters'

import { useProductContext } from '@/context/product'

import { Loading } from './Loading'
import { ProductEditor } from './ProductEditor'
import Ansi from '@curvenote/ansi-to-react'
import { MdChevronRight } from 'react-icons/md'

export default function Product() {
  const product = useProductContext()

  if (product == null) {
    return <Loading />
  }

  if (product.file.type === 'assembly') {
    return <ProductAssembly />
  }

  throw new Error(`Unknown product type: ${product.file.type}`)
}

function ProductAssembly() {
  return (
    <Resplit.Root direction="horizontal" asChild>
      <Flex sx={{ width: '100%', height: '100%' }}>
        <Resplit.Pane order={0} initialSize="0.5fr" minSize="0.1fr" asChild>
          <ProductEditor />
        </Resplit.Pane>
        <Resplit.Splitter order={1} size="16px" asChild>
          <Box sx={{ backgroundColor: 'gray.100' }} />
        </Resplit.Splitter>
        <Resplit.Pane order={2} initialSize="0.5fr" minSize="0.1fr">
          <ProductAssemblyViewer />
        </Resplit.Pane>
      </Flex>
    </Resplit.Root>
  )
}

function ProductAssemblyViewer() {
  const context = useSandboxContext()

  if (context == null) return <Loading />

  const { renderError, validationErrors } = context

  if (renderError != null) {
    return <RenderErrorDisplay renderError={renderError} />
  }

  if (Object.values(validationErrors).filter((v) => v != null).length > 0) {
    return <ValidationErrorsDisplay validationErrors={validationErrors} />
  }

  return (
    <Resplit.Root direction="vertical" asChild>
      <Flex sx={{ flexDirection: 'column', width: '100%', height: '100%' }}>
        <Resplit.Pane order={0} initialSize="0.8fr" minSize="0.4fr" asChild>
          <VStack sx={{ padding: 3, minWidth: 0 }}>
            <ProductAssemblyTitle />
            <Box sx={{ flexGrow: 1, minHeight: 0, width: '100%' }}>
              <ProductAssemblyGl />
            </Box>
          </VStack>
        </Resplit.Pane>
        <Resplit.Splitter order={1} size="16px" asChild>
          <Box sx={{ backgroundColor: 'gray.100' }} />
        </Resplit.Splitter>
        <Resplit.Pane order={2} initialSize="0.2fr" minSize="0.1fr">
          <VStack spacing={8} sx={{ height: '100%', padding: 3, overflowY: 'auto' }}>
            <ProductAssemblyDetails />
          </VStack>
        </Resplit.Pane>
      </Flex>
    </Resplit.Root>
  )
}

function ProductAssemblyGl() {
  return (
    <React.Suspense fallback={<Loading />}>
      <Sandbox showParameterControls />
    </React.Suspense>
  )
}

function ProductAssemblyTitle() {
  const { render } = useSandboxContext()

  return <Heading as="h2">{render?.meta?.label}</Heading>
}

function ProductAssemblyDetails() {
  const { render } = useSandboxContext()

  if (render?.type !== 'assembly') return <Loading />

  return (
    <>
      <ParameterControls />
      <AssemblyInfo />
    </>
  )
}

type RenderErrorDisplayProps = {
  renderError: NonNullable<DesignRenderError>
}

function RenderErrorDisplay(props: RenderErrorDisplayProps) {
  const { renderError } = props

  let inner
  switch (renderError.type) {
    case 'typescript.transform':
      inner = (
        <Box as="code">
          <Box as="pre">
            <Ansi>{renderError.error}</Ansi>
          </Box>
        </Box>
      )
      break
    case 'javascript.evaluate':
      inner = (
        <Box>
          <Box sx={{ fontWeight: 'bold' }}>{renderError.error.message}</Box>
          <List>
            {renderError.error.stack.map((frame) => (
              <ListItem>
                <ListIcon as={MdChevronRight} />
                at line {frame.line}, column {frame.column}
                {frame.name !== '' && <>, function {frame.name}</>}
              </ListItem>
            ))}
          </List>
        </Box>
      )
      break
    case 'javascript.validate':
      inner = (
        <Box as="code">
          <Box as="pre">{renderError.error.message}</Box>
        </Box>
      )
      break
  }

  return <ErrorBox>{inner}</ErrorBox>
}

type ValidationErrorsDisplayProps = {
  validationErrors: DesignValidationErrors
}

function ValidationErrorsDisplay(props: ValidationErrorsDisplayProps) {
  const { validationErrors } = props

  return (
    <ErrorBox>
      <List>
        {Object.entries(validationErrors).map(
          ([key, error]) =>
            error != null && (
              <ListItem key={key}>
                <HStack sx={{ alignItems: 'flex-start' }}>
                  <Box sx={{ fontWeight: 'bold' }}>{key} :</Box>
                  <Box>{error.message}</Box>
                </HStack>
              </ListItem>
            ),
        )}
      </List>
    </ErrorBox>
  )
}

type ErrorBoxProps = {
  children: React.ReactNode
}

function ErrorBox(props: ErrorBoxProps) {
  const { children } = props

  return (
    <Box
      sx={{
        backgroundColor: 'red.100',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {children}
    </Box>
  )
}
