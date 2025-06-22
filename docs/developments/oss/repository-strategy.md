name: Sync to Open Source Repository

on:
  push:
    branches: [main]
    paths:
      - 'src/core/**'
      - 'docs/oss/**'
      - 'public/**'
      - 'components/ui/**'
      - 'package.json'
      - 'README.oss.md'
  workflow_dispatch:

jobs:
  sync-to-oss:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout private repo
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Prepare OSS version
        run: |
          # OSS版用のディレクトリを作成
          mkdir -p oss-temp
          
          # Core機能をコピー
          cp -r src/core/* oss-temp/src/
          cp -r components/ui/* oss-temp/components/ui/
          cp -r public/* oss-temp/public/
          
          # OSS版専用ファイルをコピー
          cp README.oss.md oss-temp/README.md
          cp LICENSE.oss oss-temp/LICENSE
          
          # package.jsonを OSS版用に調整
          node scripts/prepare-oss-package.js
          
          # 商用機能への参照を削除
          node scripts/remove-premium-refs.js

      - name: Checkout OSS repository
        uses: actions/checkout@v4
        with:
          repository: otomatty/kouden-oss
          token: ${{ secrets.OSS_SYNC_TOKEN }}
          path: oss-repo

      - name: Sync changes
        run: |
          # 既存ファイルを削除（.git以外）
          find oss-repo -mindepth 1 -name '.git' -prune -o -type f -delete
          find oss-repo -mindepth 1 -name '.git' -prune -o -type d -empty -delete
          
          # 新しいファイルをコピー
          cp -r oss-temp/* oss-repo/
          
          # Git設定
          cd oss-repo
          git config user.name "OSS Sync Bot"
          git config user.email "oss-sync@kouden.app"
          
          # 変更をコミット・プッシュ
          git add .
          if git diff --staged --quiet; then
            echo "No changes to commit"
          else
            git commit -m "chore: sync from private repository [$(date +'%Y-%m-%d %H:%M:%S')]"
            git push
          fi

      - name: Create release (on tag)
        if: startsWith(github.ref, 'refs/tags/')
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.OSS_SYNC_TOKEN }}
        with:
          repo: otomatty/kouden-oss
          tag_name: ${{ github.ref_name }}
          release_name: Release ${{ github.ref_name }}
          body: |
            ## Changes
            See the [changelog](https://github.com/otomatty/kouden-oss/blob/main/CHANGELOG.md) for details.
            
            ## Download
            - [Source code (zip)](https://github.com/otomatty/kouden-oss/archive/refs/tags/${{ github.ref_name }}.zip)
            - [Source code (tar.gz)](https://github.com/otomatty/kouden-oss/archive/refs/tags/${{ github.ref_name }}.tar.gz) 