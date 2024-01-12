// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::{ffi::OsString, path::PathBuf};
use tokio::fs::create_dir_all;
use toml::{de::Error as TomlDeError, ser::Error as TomlSerError};

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_workspaces,
            add_workspace,
            remove_workspace,
            list_products,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[derive(Debug, thiserror::Error)]
enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error("failed to parse toml")]
    ParseToml(#[source] TomlDeError),
    #[error("failed to display toml")]
    DisplayToml(#[source] TomlSerError),
    #[error("could not resolve app dir")]
    NoAppDir,
    #[error("invalid product file path: {path}")]
    InvalidProductPath { path: PathBuf },
}

impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

type Result<T> = std::result::Result<T, Error>;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct WorkspaceConfig {
    path: PathBuf,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
struct AppConfig {
    workspaces: Vec<WorkspaceConfig>,
}

async fn get_app_config_path(app_handle: tauri::AppHandle) -> Result<PathBuf> {
    let app_dir = app_handle
        .path_resolver()
        .app_config_dir()
        .ok_or(Error::NoAppDir)?;
    if !tokio::fs::try_exists(app_dir.clone()).await? {
        tokio::fs::create_dir_all(app_dir.clone()).await?;
    }
    let app_config_path = app_dir.join("config.toml");
    Ok(app_config_path)
}

async fn load_app_config(app_handle: tauri::AppHandle) -> Result<AppConfig> {
    let app_config_path = get_app_config_path(app_handle).await?;
    if tokio::fs::try_exists(app_config_path.clone()).await? {
        let app_config_string = tokio::fs::read_to_string(app_config_path).await?;
        let app_config = toml::from_str(&app_config_string).map_err(Error::ParseToml)?;
        Ok(app_config)
    } else {
        Ok(AppConfig::default())
    }
}

async fn save_app_config(app_handle: tauri::AppHandle, app_config: AppConfig) -> Result<()> {
    let app_config_path = get_app_config_path(app_handle).await?;
    let config_string = toml::to_string_pretty(&app_config).map_err(Error::DisplayToml)?;
    println!("app_config_path: {:?}", app_config_path);
    tokio::fs::write(app_config_path, config_string).await?;
    Ok(())
}

#[tauri::command]
async fn list_workspaces(app_handle: tauri::AppHandle) -> Result<Vec<WorkspaceConfig>> {
    let config = load_app_config(app_handle).await?;

    Ok(config.workspaces)
}

#[tauri::command]
async fn add_workspace(app_handle: tauri::AppHandle, workspace: WorkspaceConfig) -> Result<()> {
    let mut app_config = load_app_config(app_handle.clone()).await?;
    app_config.workspaces.push(workspace);
    save_app_config(app_handle, app_config).await?;
    Ok(())
}

#[tauri::command]
async fn remove_workspace(app_handle: tauri::AppHandle, workspace_path: PathBuf) -> Result<()> {
    let mut app_config = load_app_config(app_handle.clone()).await?;
    app_config
        .workspaces
        .retain(|workspace| workspace.path != workspace_path);
    save_app_config(app_handle, app_config).await?;
    Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ProductIndex {
    path: PathBuf,
    name: String,
}

#[tauri::command]
async fn list_products(workspace_path: PathBuf) -> Result<Vec<ProductIndex>> {
    let mut dir_reader = tokio::fs::read_dir(workspace_path).await?;
    let mut products = Vec::new();
    loop {
        let Some(next_dir_entry) = dir_reader.next_entry().await? else {
            break;
        };
        let product_path = next_dir_entry.path();
        let product_name = product_path
            .clone()
            .file_name()
            .and_then(|file_name| file_name.to_str())
            .ok_or_else(|| Error::InvalidProductPath {
                path: product_path.clone(),
            })?
            .to_string();
        products.push(ProductIndex {
            path: product_path,
            name: product_name,
        })
    }

    Ok(products)
}
