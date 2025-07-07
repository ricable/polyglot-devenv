#!/usr/bin/env python3
"""
Enhanced PRP Generation Command with Version Control and Scalability
Uses the integrated PRP system with Memento/Observer and Mediator/Factory patterns.

Addresses Issues #6 and #8: Version Control and Scalability
"""

import sys
import asyncio
import argparse
from pathlib import Path

# Add the context-engineering lib to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "context-engineering" / "lib"))

from integrated_prp_system import IntegratedPRPSystem


async def main():
    """Enhanced PRP generation with version control and scalability."""
    parser = argparse.ArgumentParser(description="Generate PRP with version control and scalability")
    parser.add_argument("feature_file", help="Path to feature requirements file")
    parser.add_argument("--env", default="python-env", help="Target environment")
    parser.add_argument("--template", default="full", help="Template type")
    parser.add_argument("--debug", action="store_true", help="Enable debug output")
    parser.add_argument("--no-versioning", action="store_true", help="Disable version control")
    parser.add_argument("--workers", type=int, default=4, help="Number of worker threads")
    
    args = parser.parse_args()
    
    # Initialize integrated system
    system = IntegratedPRPSystem(max_workers=args.workers)
    await system.initialize()
    
    try:
        # Read feature file
        feature_path = Path(args.feature_file)
        if not feature_path.exists():
            print(f"❌ Feature file not found: {args.feature_file}")
            return 1
        
        feature_content = feature_path.read_text()
        feature_name = feature_path.stem
        
        # Extract requirements from feature file
        requirements = {
            "content": feature_content,
            "template_type": args.template,
            "feature_file": str(feature_path)
        }
        
        # Add complexity detection
        if "simple" in feature_content.lower() or "basic" in feature_content.lower():
            requirements["complexity"] = "simple"
        elif "complex" in feature_content.lower() or "advanced" in feature_content.lower():
            requirements["complexity"] = "complex" 
        else:
            requirements["complexity"] = "medium"
        
        print(f"🚀 Generating PRP: {feature_name}")
        print(f"   Environment: {args.env}")
        print(f"   Template: {args.template}")
        print(f"   Complexity: {requirements['complexity']}")
        print(f"   Version control: {'enabled' if not args.no_versioning else 'disabled'}")
        
        # Generate PRP with integrated system
        result = await system.generate_prp_with_versioning(
            feature_name,
            args.env,
            requirements,
            save_versions=not args.no_versioning
        )
        
        if result and result.success:
            print(f"✅ PRP generated successfully")
            print(f"   Output: {result.result.get('file_path', 'unknown')}")
            print(f"   Execution time: {result.execution_time:.2f}s")
            
            if not args.no_versioning:
                # Show version information
                versions = system.list_prp_versions(f"{feature_name}-{args.env}")
                if versions:
                    latest_version = versions[0]
                    print(f"   Version: {latest_version['version_id']}")
                    print(f"   Checksum: {latest_version['checksum']}")
            
            # Show system status
            if args.debug:
                status = system.get_system_status()
                print(f"\n📊 System Status:")
                print(f"   Session: {status['session_id']}")
                print(f"   Tasks completed: {status['performance_metrics']['tasks_completed']}")
                print(f"   Success rate: {status['performance_metrics']['success_rate']:.1%}")
                print(f"   Version saves: {status['performance_metrics']['version_saves']}")
        
        else:
            print(f"❌ PRP generation failed")
            if result and result.error:
                print(f"   Error: {result.error}")
            return 1
    
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        if args.debug:
            import traceback
            traceback.print_exc()
        return 1
    
    finally:
        system.shutdown()
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)