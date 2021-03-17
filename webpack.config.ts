import * as path from "path";
import * as webpack from "webpack";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import HtmlWebPackPlugin from "html-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";

const clientConfig: webpack.Configuration = {
    devtool: "source-map",
    entry: path.join(__dirname, "src/app.ts"),
    output: {
        path: path.join(__dirname, "dist"),
        filename: "[name].js"
    },
    resolve: {
        modules: [
            path.join(__dirname, "src"),
            path.join(__dirname, "node_modules")
        ],
        extensions: [".ts", ".js"]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: "ts-loader"
            }
        ],
    },
    devServer: {
        contentBase: path.join(__dirname, "test"),
        port: 9000,
        writeToDisk: true
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebPackPlugin({
            template: "src/index.html"
        }),
        new CopyPlugin({
            patterns: [
                { from: "assets/atlases", to: "atlases" },
                { from: "assets/test", to: "test" }
            ]
        })
    ]
};

export default clientConfig;